package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"service_chat/services"
	"service_chat/utils"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

type Client struct {
	UserID   string
	Conn     *websocket.Conn
	Rooms    []*Room
	Outbound chan []byte
}

type Room struct {
	RoomID  string
	Clients map[string]*Client
	Join    chan *Client
	Leave   chan *Client
	Message chan []byte
	Mutex   sync.Mutex
}

type ChatServer struct {
	Rooms map[string]*Room
	Mutex sync.Mutex
}

func NewRoom(id string) *Room {
	return &Room{
		RoomID:  id,
		Clients: make(map[string]*Client),
		Join:    make(chan *Client),
		Leave:   make(chan *Client),
		Message: make(chan []byte),
	}
}

func (r *Room) Run() {
	for {
		select {
		case client := <-r.Join:
			r.Mutex.Lock()
			r.Clients[client.UserID] = client
			r.Mutex.Unlock()
			log.Println(client.UserID + "'s connected")
		case client := <-r.Leave:
			r.Mutex.Lock()
			delete(r.Clients, client.UserID)
			r.Mutex.Unlock()
			log.Println(client.UserID + "'s disconnected")
		case msg := <-r.Message:
			r.Broadcast(msg)
		}
	}
}

func (r *Room) Broadcast(message []byte) {
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	for userID, client := range r.Clients {
		select {
		case client.Outbound <- message:
		default:
			close(client.Outbound) // ป้องกัน memory leak
			delete(r.Clients, userID)
		}
	}
}

func NewChatServer() *ChatServer {
	return &ChatServer{
		Rooms: make(map[string]*Room),
	}
}

func (cs *ChatServer) GetOrCreateRoom(roomID string) *Room {
	cs.Mutex.Lock()
	defer cs.Mutex.Unlock()

	room, exist := cs.Rooms[roomID]
	if !exist {
		room = NewRoom(roomID)
		cs.Rooms[roomID] = room
		go room.Run()
	}

	return room
}

type HandleWebSocketStruct struct {
	Rdclient *redis.Client
	Ctx      context.Context
}

func NewHandleWebSocket(r *redis.Client, c context.Context) *HandleWebSocketStruct {
	return &HandleWebSocketStruct{
		Rdclient: r,
		Ctx:      c,
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *HandleWebSocketStruct) HandleWebSocket(server *ChatServer, w http.ResponseWriter, r *http.Request) {
	cookies := r.Cookies()
	var token string
	secret := os.Getenv("JWT_SECRET")

	for _, c := range cookies {
		if c.Name == "token" {
			token = c.Value
		}
	}

	if token == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	userId, err := utils.GetUserIdFromToken(token, secret)
	if err != nil {
		http.Error(w, "unauthorized token", http.StatusUnauthorized)
		return
	}

	keys, err := services.GetAllKeyRoom(userId)
	if err != nil {
		http.Error(w, "failed to get key on redis", http.StatusInternalServerError)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "failed to upgrade connection", http.StatusInternalServerError)
		return
	}

	client := &Client{
		UserID:   userId,
		Conn:     conn,
		Rooms:    []*Room{},
		Outbound: make(chan []byte, 256),
	}

	for _, roomID := range keys {
		room := server.GetOrCreateRoom(roomID)
		client.Rooms = append(client.Rooms, room)
	}

	go readPump(client, server)
	go writePump(client)
}

func readPump(client *Client, server *ChatServer) {
	defer func() {
		for _, room := range client.Rooms {
			room.Leave <- client
		}
		client.Conn.Close()
	}()

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var data struct {
			Type   string `json:"type"`
			RoomID string `json:"room_id"`
			Text   string `json:"text,omitempty"`
		}
		if err := json.Unmarshal(message, &data); err != nil {
			log.Println("invalid JSON format")
			continue
		}

		switch data.Type {
		case "join":
			room := server.GetOrCreateRoom(data.RoomID)
			client.Rooms = append(client.Rooms, room)
			room.Join <- client
			log.Printf("User %s joined room %s", client.UserID, data.RoomID)
		case "leave":
			for i, room := range client.Rooms {
				if room.RoomID == data.RoomID {
					room.Leave <- client
					client.Rooms = append(client.Rooms[:i], client.Rooms[i+1:]...)
					log.Printf("User %s left room %s", client.UserID, data.RoomID)
					break
				}
			}
		case "message":
			for _, room := range client.Rooms {
				if room.RoomID == data.RoomID {
					type sendStruct struct {
						RoomID     string `json:"room_id"`
						SenderID   string `json:"serder_id"`
						ReceiverID string `json:"receiver_id"`
						Message    string `json:"message"`
					}

					roomId := data.RoomID
					senderId := client.UserID
					parts := strings.Split(roomId, "_")
					var receiverId string

					for _, v := range parts {
						if v != senderId {
							receiverId = v
							break
						}
					}

					send, _ := json.Marshal(sendStruct{
						RoomID:     roomId,
						SenderID:   senderId,
						ReceiverID: receiverId,
						Message:    data.Text,
					})

					formattedMsg := fmt.Sprintln(string(send))
					room.Message <- []byte(formattedMsg)

					go services.SaveMessageToMongoDB(data.RoomID, client.UserID, receiverId, data.Text)
				}
			}
		}
	}
}

func writePump(client *Client) {
	defer client.Conn.Close()

	for {
		select {
		case message, ok := <-client.Outbound:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			err := client.Conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
		}
	}
}
