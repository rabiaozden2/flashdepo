package handlers

import (
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Allow all origins for dev
}

type WsHandler struct {
	clients map[*websocket.Conn]bool
	mutex   sync.Mutex
}

func NewWsHandler() *WsHandler {
	return &WsHandler{
		clients: make(map[*websocket.Conn]bool),
	}
}

// HandleWS godoc
// @Summary WebSocket connection
// @Description Connect to WebSocket for real-time stock updates
// @Tags WebSocket
// @Router /ws [get]
func (h *WsHandler) HandleWS(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	h.mutex.Lock()
	h.clients[ws] = true
	h.mutex.Unlock()

	defer func() {
		h.mutex.Lock()
		delete(h.clients, ws)
		h.mutex.Unlock()
		ws.Close()
	}()

	// Keep connection alive
	for {
		if _, _, err := ws.ReadMessage(); err != nil {
			break
		}
	}
}

// BroadcastMessage sends a message to all connected clients
func (h *WsHandler) BroadcastMessage(msg interface{}) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	for client := range h.clients {
		err := client.WriteJSON(msg)
		if err != nil {
			log.Printf("WebSocket write error: %v", err)
			client.Close()
			delete(h.clients, client)
		}
	}
}
