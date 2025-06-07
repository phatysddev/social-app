package connections

import (
	"context"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client
var RedisCtx context.Context

func InitRedis() error {
	rdb := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_ADDR"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})

	ctx := context.Background()

	pong, err := rdb.Ping(ctx).Result()
	if err != nil {
		return err
	}
	log.Printf("Redis connection successful: %s\n", pong)

	RedisClient = rdb
	RedisCtx = ctx

	return nil
}

func DisconnectRedis() error {
	return RedisClient.Close()
}
