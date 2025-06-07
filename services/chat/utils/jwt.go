package utils

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

func VerifyToken(tokenString string, secret string) (*jwt.Token, error) {
	// ฟังก์ชันสำหรับการตรวจสอบ signing method และ secret key
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// ตรวจสอบว่า signing method เป็น HMAC หรือไม่
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// คืนค่า secret key
		return []byte(secret), nil
	})

	return token, err
}

func GetUserIdFromToken(tokenString string, secret string) (string, error) {
	token, err := VerifyToken(tokenString, secret)
	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userId := claims["id"].(string)
		return userId, nil
	}

	return "", fmt.Errorf("invalid token claims")
}
