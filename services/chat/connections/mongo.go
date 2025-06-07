package connections

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	MongoClient     *mongo.Client
	ChatCollection  *mongo.Collection
	UnreadColletion *mongo.Collection
	RoomCollection  *mongo.Collection
)

// Schema
type ChatMessage struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	RoomID     string             `bson:"room_id"`
	SenderID   string             `bson:"sender_id"`
	ReceiverID string             `bson:"receiver_id"`
	Message    string             `bson:"message"`
	Timestamp  time.Time          `bson:"timestamp"`
	IsRead     bool               `bson:"is_read"`
}

type UnreadCounter struct {
	ID      primitive.ObjectID `bson:"_id,omitempty"`
	UserID  string             `bson:"user_id"`
	RoomID  string             `bson:"room_id"`
	Count   int                `bson:"count"`
	Updated time.Time          `bson:"updated"`
}

type ChatRoom struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	RoomID    string             `bson:"room_id"`
	UserIDs   []string           `bson:"user_ids"`
	CreatedAt time.Time          `bson:"created_at"`
}

// Init database
func InitMongoDB() error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	if err != nil {
		return fmt.Errorf("mongo connect error: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		return fmt.Errorf("mongo ping error: %w", err)
	}

	MongoClient = client
	db := client.Database("chatdb")

	ChatCollection = db.Collection("messages")
	UnreadColletion = db.Collection("unread_collection")
	RoomCollection = db.Collection("chat_rooms")

	if err := createIndexes(ctx); err != nil {
		return fmt.Errorf("createIndexes error: %w", err)
	}

	log.Println("MongoDB connected and collection/indexes initialized")
	return nil
}

func createIndexes(ctx context.Context) error {
	_, err := ChatCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "room_id", Value: 1},
				{Key: "timestamp", Value: -1},
			},
		},
		{
			Keys: bson.D{
				{Key: "receiver_id", Value: 1},
				{Key: "is_read", Value: 1},
			},
		},
	})
	if err != nil {
		return err
	}

	_, err = UnreadColletion.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{
			{Key: "user_id", Value: 1},
			{Key: "room_id", Value: 1},
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	_, err = RoomCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "room_id", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	return err
}

func DisconnectMongoDB() error {
	return MongoClient.Disconnect(context.Background())
}
