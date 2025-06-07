package services

import (
	"context"
	"service_chat/connections"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func SaveMessageToMongoDB(roomId, senderId, receiverId, message string) error {
	loc, _ := time.LoadLocation("Asia/Bangkok")
	msg := &connections.ChatMessage{
		RoomID:     roomId,
		ReceiverID: receiverId,
		SenderID:   senderId,
		Message:    message,
		IsRead:     false,
		Timestamp:  time.Now().In(loc),
	}

	_, err := connections.ChatCollection.InsertOne(context.Background(), msg)
	return err
}

func LoadMessageFromMongoDB(roomId string) ([]connections.ChatMessage, error) {
	filter := bson.D{{Key: "room_id", Value: roomId}}
	findOptions := options.Find()
	findOptions.SetLimit(10)
	findOptions.SetSort(bson.D{{Key: "timestamp", Value: -1}})

	cursor, err := connections.ChatCollection.Find(context.Background(), filter, findOptions)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	var messages []connections.ChatMessage
	if err := cursor.All(context.Background(), &messages); err != nil {
		return nil, err
	}
	return messages, nil
}
