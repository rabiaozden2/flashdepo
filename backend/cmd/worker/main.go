package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/rabiaozden2/flashdepo/backend/internal/models"
)

type OrderMessage struct {
	OrderID    uuid.UUID `json:"order_id"`
	UserID     uuid.UUID `json:"user_id"`
	CampaignID uuid.UUID `json:"campaign_id"`
	ProductID  uuid.UUID `json:"product_id"`
	Quantity   int       `json:"quantity"`
	TotalPrice float64   `json:"total_price"`
}

type NotificationJob struct {
	Name string      `json:"name"`
	Data interface{} `json:"data"`
	Opts interface{} `json:"opts"`
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env variables")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://root:secretpassword@localhost:5432/flashdepo?sslmode=disable"
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	rdb := redis.NewClient(&redis.Options{Addr: redisURL})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Received termination signal. Shutting down gracefully...")
		cancel()
	}()

	log.Println("Process Worker started, listening on process_queue...")

	for {
		select {
		case <-ctx.Done():
			log.Println("Worker exited.")
			return
		default:
			// Blocking pop from Redis queue (timeout 2 seconds to check ctx)
			result, err := rdb.BRPop(ctx, 2*time.Second, "process_queue").Result()
			if err != nil {
				if err == redis.Nil {
					continue // timeout, loop again
				}
				// Context cancelled returns err
				continue
			}

			if len(result) < 2 {
				continue
			}

			var msg OrderMessage
			if err := json.Unmarshal([]byte(result[1]), &msg); err != nil {
				log.Printf("Failed to unmarshal order message: %v\n", err)
				continue
			}

			processOrder(ctx, db, rdb, msg)
		}
	}
}

func processOrder(ctx context.Context, db *gorm.DB, rdb *redis.Client, msg OrderMessage) {
	err := db.Transaction(func(tx *gorm.DB) error {
		// Decrement product stock in DB
		if err := tx.Model(&models.Product{}).
			Where("id = ? AND stock >= ?", msg.ProductID, msg.Quantity).
			UpdateColumn("stock", gorm.Expr("stock - ?", msg.Quantity)).Error; err != nil {
			return err
		}

		// Decrement campaign stock in DB
		if err := tx.Model(&models.Campaign{}).
			Where("id = ? AND campaign_stock >= ?", msg.CampaignID, msg.Quantity).
			UpdateColumn("campaign_stock", gorm.Expr("campaign_stock - ?", msg.Quantity)).Error; err != nil {
			return err
		}

		// Update order status to completed
		if err := tx.Model(&models.Order{}).Where("id = ?", msg.OrderID).Update("status", "completed").Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		log.Printf("Order processing failed for OrderID %s: %v\n", msg.OrderID, err)
		// Mark order as failed
		db.Model(&models.Order{}).Where("id = ?", msg.OrderID).Update("status", "failed")
		
		// Push failure notification
		pushNotification(ctx, rdb, "order_failed", msg)
	} else {
		log.Printf("Order processed successfully for OrderID %s\n", msg.OrderID)
		// Push success notification
		pushNotification(ctx, rdb, "order_success", msg)
	}
}

// Push BullMQ compatible job payload
func pushNotification(ctx context.Context, rdb *redis.Client, name string, msg OrderMessage) {
	job := NotificationJob{
		Name: name,
		Data: msg,
		Opts: map[string]interface{}{},
	}
	jobBytes, _ := json.Marshal(job)
	
	// Push to BullMQ queue format: bull:notifications:wait
	// Actually BullMQ is slightly more complex, but a standard LPush works if simple.
	// For full BullMQ compatibility we'd use a Lua script, but LPush to wait queue works minimally.
	rdb.RPush(ctx, "bull:notifications:wait", jobBytes)
}
