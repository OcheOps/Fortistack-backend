package responses

import (
	"encoding/json"
	"net/http"
)

type Envelope struct {
	Data  interface{} `json:"data,omitempty"`
	Error interface{} `json:"error,omitempty"`
}

type ErrorPayload struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if data == nil {
		json.NewEncoder(w).Encode(Envelope{Data: nil})
		return
	}

	json.NewEncoder(w).Encode(Envelope{Data: data})
}

func ErrorJSON(w http.ResponseWriter, status int, err error) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	msg := err.Error()
	if status == http.StatusInternalServerError {
		msg = "Internal Server Error"
	}

	payload := ErrorPayload{
		Code:    http.StatusText(status),
		Message: msg,
	}

	json.NewEncoder(w).Encode(Envelope{
		Data:  nil,
		Error: payload,
	})
}
