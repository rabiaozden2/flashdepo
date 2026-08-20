package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/rabiaozden2/flashdepo/backend/internal/auth"
	"github.com/rabiaozden2/flashdepo/backend/internal/handlers"
	"github.com/rabiaozden2/flashdepo/backend/internal/middleware"
)

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
	rdb := redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Global rate limit: 120 requests per minute per IP
	r.Use(middleware.RateLimit(rdb, 120, time.Minute))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")

	// WebSocket
	wsHandler := handlers.NewWsHandler()
	api.GET("/ws", wsHandler.HandleWS)

	// Auth
	authHandler := &handlers.AuthHandler{DB: db}
	api.POST("/auth/login", authHandler.Login)
	api.POST("/auth/register", authHandler.Register)

	// Campaigns (public)
	campaignHandler := &handlers.CampaignHandler{DB: db}
	api.GET("/campaigns", campaignHandler.List)

	// Campaigns (admin only)
	adminCampaigns := api.Group("/campaigns")
	adminCampaigns.Use(auth.RequireAuth())
	adminCampaigns.Use(auth.RequireRole("admin"))
	adminCampaigns.POST("", campaignHandler.Create)
	adminCampaigns.PUT("/:id", campaignHandler.Update)
	adminCampaigns.DELETE("/:id", campaignHandler.Delete)

	// Products (public list)
	productHandler := &handlers.ProductHandler{DB: db}
	api.GET("/products", productHandler.List)
	api.GET("/products/autofill", productHandler.Autofill)

	// Products (manager or admin)
	managerProducts := api.Group("/products")
	managerProducts.Use(auth.RequireAuth())
	managerProducts.POST("", productHandler.Create)

	// Warehouses (public)
	warehouseHandler := &handlers.WarehouseHandler{DB: db}
	api.GET("/warehouses", warehouseHandler.List)

	// Users (admin only)
	userHandler := &handlers.UserHandler{DB: db}
	adminUsers := api.Group("/users")
	adminUsers.Use(auth.RequireAuth())
	adminUsers.Use(auth.RequireRole("admin"))
	adminUsers.GET("", userHandler.List)

	// Orders
	orderHandler := &handlers.OrderHandler{DB: db, Redis: rdb, Ws: wsHandler}
	orders := api.Group("/orders")
	orders.Use(auth.RequireAuth())
	orders.GET("", orderHandler.List)                            // any authenticated user
	orders.Use(auth.RequireRole("customer", "admin")).POST("", orderHandler.Create) // customer and admin
	orders.Use(auth.RequireRole("customer", "admin")).POST("/bulk", orderHandler.BulkCreate) // bulk order

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		log.Printf("Server listening on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down API server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("API server exiting")
}
