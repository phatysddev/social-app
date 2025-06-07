package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"service_chat/connections"
	"service_chat/utils"
)

func GetAllKeyRoom(userId string) ([]string, error) {
	var keys []string

	scanKeys := func(pattern string) error {
		var cursor uint64
		for {
			result, nextCursor, err := connections.RedisClient.Scan(connections.RedisCtx, cursor, pattern, 10).Result()
			if err != nil {
				return err
			}
			keys = append(keys, result...)
			cursor = nextCursor
			if cursor == 0 {
				break
			}
		}
		return nil
	}

	if err := scanKeys(fmt.Sprintf("chat:room:%s:*", userId)); err != nil {
		return nil, err
	}
	if err := scanKeys(fmt.Sprintf("chat:room:*:%s", userId)); err != nil {
		return nil, err
	}

	return keys, nil
}

type ResponseGetRoom struct {
	RoomID   string                    `json:"room_id"`
	User     UserData                  `json:"user"`
	Receiver UserData                  `json:"receiver"`
	History  []connections.ChatMessage `json:"history"`
}

type UserData struct {
	UserID   string  `json:"user_id,omitempty"`
	Username string  `json:"username"`
	Avatar   *string `json:"avatar_url"`
}

type RedisDataStruct struct {
	RoomID    string              `json:"roomID"`
	User      map[string]UserData `json:"user"`
	Timestamp int64               `json:"timestamp"`
}

func HandleGetRoom(w http.ResponseWriter, r *http.Request) {
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

	keys, err := GetAllKeyRoom(userId)
	if err != nil {
		http.Error(w, "failed to get key on redis", http.StatusInternalServerError)
		return
	}

	var response []ResponseGetRoom

	for _, key := range keys {
		val, err := connections.RedisClient.Get(connections.RedisCtx, key).Result()
		if err != nil {
			log.Println("Error get redis key:", err)
			continue
		}

		var decode RedisDataStruct
		if err := json.Unmarshal([]byte(val), &decode); err != nil {
			log.Println("Error decoding JSON:", err)
			continue
		}

		var receiver UserData
		for id, user := range decode.User {
			if id != userId {
				receiver = user
				receiver.UserID = id
				break
			}
		}

		currentUser := decode.User[userId]
		currentUser.UserID = userId

		history, err := LoadMessageFromMongoDB(decode.RoomID)
		if err != nil {
			log.Println("Error load message history: ", err)
			continue
		}

		format := ResponseGetRoom{
			RoomID:   decode.RoomID,
			User:     currentUser,
			Receiver: receiver,
			History:  history,
		}

		response = append(response, format)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
