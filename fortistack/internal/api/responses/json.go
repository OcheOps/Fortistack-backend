package responses

import (
	"encoding/json"
	"net/http"
)

type Envelope struct {
	Data  interface{} `json:"data,omitempty"`
	Error interface{} `json:"error,omitempty"`
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

	json.NewEncoder(w).Encode(Envelope{
		Error: map[string]string{
			"message": err.Error(),
		},
	})
}
