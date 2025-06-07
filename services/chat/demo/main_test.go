package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	ID       string
	Conn     *websocket.Conn
	Room     *Room
	Outbound chan []byte
}

type Room struct {
	ID      string
	Clients map[string]*Client
	Join    chan *Client
	Leave   chan *Client
	Message chan []byte
	mutex   sync.Mutex
}

type ChatServer struct {
	Rooms map[string]*Room
	mutex sync.Mutex
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func NewRoom(id string) *Room {
	return &Room{
		ID:      id,
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
			r.mutex.Lock()
			r.Clients[client.ID] = client
			r.mutex.Unlock()
			log.Printf("Client %s joined room %s", client.ID, r.ID)
			r.Broadcast([]byte(fmt.Sprintf("User %s joined the room", client.ID)))
		case client := <-r.Leave:
			r.mutex.Lock()
			delete(r.Clients, client.ID)
			r.mutex.Unlock()
			close(client.Outbound)
			log.Printf("Client %s left room %s", client.ID, r.ID)
			r.Broadcast([]byte(fmt.Sprintf("User %s left the room", client.ID)))
		case msg := <-r.Message:
			r.Broadcast(msg)
		}
	}
}

func (r *Room) Broadcast(message []byte) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	for _, client := range r.Clients {
		select {
		case client.Outbound <- message:
		default:
			close(client.Outbound)
			delete(r.Clients, client.ID)
		}
	}
}

func NewChatServer() *ChatServer {
	return &ChatServer{
		Rooms: make(map[string]*Room),
	}
}

func (s *ChatServer) GetOrCreateRoom(roomID string) *Room {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	room, exists := s.Rooms[roomID]
	if !exists {
		room = NewRoom(roomID)
		s.Rooms[roomID] = room
		go room.Run()
	}

	return room
}

func handleWebSocket(server *ChatServer, w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room")
	userID := r.URL.Query().Get("user")

	if roomID == "" || userID == "" {
		http.Error(w, "missing room or user ID", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	room := server.GetOrCreateRoom(roomID)

	client := &Client{
		ID:       userID,
		Conn:     conn,
		Room:     room,
		Outbound: make(chan []byte, 256),
	}

	room.Join <- client

	go readPump(client)
	go writePump(client)
}

func readPump(client *Client) {
	defer func() {
		client.Room.Leave <- client
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

		formattedMsg := fmt.Sprintf("%s:%s", client.ID, message)
		client.Room.Message <- []byte(formattedMsg)
	}
}

func writePump(client *Client) {
	defer client.Conn.Close()

	for {
		select {
		case message, ok := <-client.Outbound:
			if !ok {
				// The hub closed the channel
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			err := client.Conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				return
			}
		default:
			fmt.Println("")
		}
	}
}

func main() {
	server := NewChatServer()

	// Serve the HTML client
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})

	// Handle WebSocket connections
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(server, w, r)
	})

	port := ":8080"
	log.Printf("Starting server on %s", port)
	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
