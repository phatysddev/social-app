package configs

import "github.com/joho/godotenv"

func LoadEnv() error {
	err := godotenv.Load()
	return err
}
