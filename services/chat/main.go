package main

import (
	"log"
	"net/http"
	"service_chat/configs"
	"service_chat/connections"
	middleware "service_chat/middlewares"
	"service_chat/services"
)

func init() {
	var err error
	if err = configs.LoadEnv(); err != nil {
		panic("failed to load .env file")
	}
	if err = connections.InitRedis(); err != nil {
		panic("failed to connection redis")
	}
	if err = connections.InitMongoDB(); err != nil {
		panic(err)
	}
}

func main() {
	handleWebSocket := NewHandleWebSocket(connections.RedisClient, connections.RedisCtx)
	mux := http.NewServeMux()
	server := NewChatServer()

	defer func() {
		if err := connections.DisconnectMongoDB(); err != nil {
			log.Println("MongoDB disconnect error: ", err)
		}
		if err := connections.DisconnectRedis(); err != nil {
			log.Println("Redis disconnect error: ", err)
		}
	}()

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket.HandleWebSocket(server, w, r)
	})

	mux.HandleFunc("/loadroom", services.HandleGetRoom)

	handler := middleware.CORSMiddleware(mux)

	port := ":3001"
	log.Printf("Starting server on %s", port)
	err := http.ListenAndServe(port, handler)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
