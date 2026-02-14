package auth

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID   string `json:"user_id"`
	TenantID string `json:"tenant_id,omitempty"` // Empty if platform admin
	Role     string `json:"role"`
	TokenUse string `json:"token_use"` // access or refresh
	jwt.RegisteredClaims
}

func GenerateTokenPair(userID string, tenantID *string, role Role) (*TokenPair, error) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	issuer := os.Getenv("JWT_ISSUER")

	accessTTL, _ := strconv.Atoi(os.Getenv("ACCESS_TOKEN_TTL_MIN"))
	if accessTTL == 0 {
		accessTTL = 15
	}

	refreshTTL, _ := strconv.Atoi(os.Getenv("REFRESH_TOKEN_TTL_HOURS"))
	if refreshTTL == 0 {
		refreshTTL = 168
	}

	// Access Token
	tID := ""
	if tenantID != nil {
		tID = *tenantID
	}

	atClaims := Claims{
		userID,
		tID,
		string(role),
		"access",
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(accessTTL) * time.Minute)),
			Issuer:    issuer,
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, atClaims)
	accessString, err := accessToken.SignedString(secret)
	if err != nil {
		return nil, fmt.Errorf("error signing access token: %w", err)
	}

	// Refresh Token
	rtClaims := Claims{
		userID,
		tID,
		string(role),
		"refresh",
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(refreshTTL) * time.Hour)),
			Issuer:    issuer,
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, rtClaims)
	refreshString, err := refreshToken.SignedString(secret)
	if err != nil {
		return nil, fmt.Errorf("error signing refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessString,
		RefreshToken: refreshString,
	}, nil
}

func ValidateToken(tokenString string) (*Claims, error) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		if claims.TokenUse != "access" {
			return nil, fmt.Errorf("invalid token use: %s", claims.TokenUse)
		}
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func ValidateRefreshToken(tokenString string) (*Claims, error) {
	secret := []byte(os.Getenv("JWT_SECRET"))
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		if claims.TokenUse != "refresh" {
			return nil, fmt.Errorf("invalid token use: %s", claims.TokenUse)
		}
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}
