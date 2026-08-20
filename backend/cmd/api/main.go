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

	"golang.org/x/crypto/bcrypt"

	"github.com/rabiaozden2/flashdepo/backend/internal/auth"
	"github.com/rabiaozden2/flashdepo/backend/internal/handlers"
	"github.com/rabiaozden2/flashdepo/backend/internal/middleware"
	"github.com/rabiaozden2/flashdepo/backend/internal/models"
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

	// Auto Migration
	db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
	if err := db.AutoMigrate(&models.User{}, &models.Warehouse{}, &models.Product{}, &models.Campaign{}, &models.Order{}); err != nil {
		log.Printf("AutoMigrate warning: %v", err)
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	var rdb *redis.Client
	if opt, err := redis.ParseURL(redisURL); err == nil {
		rdb = redis.NewClient(opt)
	} else {
		rdb = redis.NewClient(&redis.Options{Addr: redisURL})
	}

	// Auto Seed if empty
	var warehouseCount int64
	db.Model(&models.Warehouse{}).Count(&warehouseCount)
	if warehouseCount == 0 {
		log.Println("Database is empty. Seeding initial data...")
		ctx := context.Background()

		hashPassword := func(password string) string {
			hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
			return string(hash)
		}

		admin := models.User{Email: "admin@flashdepo.com", PasswordHash: hashPassword("admin123"), Role: "admin", IsActive: true}
		manager1 := models.User{Email: "manager1@flashdepo.com", PasswordHash: hashPassword("manager123"), Role: "warehouse_manager", IsActive: true}
		customer := models.User{Email: "customer@flashdepo.com", PasswordHash: hashPassword("customer123"), Role: "customer", IsActive: true}

		db.Create(&admin)
		db.Create(&manager1)
		db.Create(&customer)

		w1 := models.Warehouse{Name: "İstanbul Ana Depo", ManagerID: &manager1.ID, IsActive: true}
		w2 := models.Warehouse{Name: "Ankara Lojistik Deposu", ManagerID: &manager1.ID, IsActive: true}
		db.Create(&w1)
		db.Create(&w2)

		p1 := models.Product{WarehouseID: w1.ID, Name: "iPhone 15 Pro Max 256GB", Description: "Titanyum kasa, A17 Pro çip", OriginalPrice: 75000, Stock: 50, ImageURL: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80"}
		p2 := models.Product{WarehouseID: w2.ID, Name: "MacBook Air M3", Description: "13.6 inç Liquid Retina ekran", OriginalPrice: 45000, Stock: 30, ImageURL: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"}
		p3 := models.Product{WarehouseID: w1.ID, Name: "AirPods Pro (2. Nesil)", Description: "Aktif Gürültü Engelleme", OriginalPrice: 8500, Stock: 100, ImageURL: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80"}
		p4 := models.Product{WarehouseID: w1.ID, Name: "PlayStation 5 Slim 1TB", Description: "Ultra yüksek hızlı SSD", OriginalPrice: 24999, Stock: 45, ImageURL: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format&fit=crop&q=80"}
		p5 := models.Product{WarehouseID: w2.ID, Name: "Samsung Galaxy S24 Ultra", Description: "Galaxy AI teknolojisi", OriginalPrice: 64999, Stock: 30, ImageURL: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80"}

		db.Create(&p1)
		db.Create(&p2)
		db.Create(&p3)
		db.Create(&p4)
		db.Create(&p5)

		now := time.Now()
		c1 := models.Campaign{ProductID: p1.ID, CampaignStock: 10, DiscountPercentage: 25, StartTime: now, EndTime: now.Add(48 * time.Hour), IsActive: true}
		c2 := models.Campaign{ProductID: p2.ID, CampaignStock: 5, DiscountPercentage: 20, StartTime: now, EndTime: now.Add(24 * time.Hour), IsActive: true}
		c3 := models.Campaign{ProductID: p3.ID, CampaignStock: 20, DiscountPercentage: 30, StartTime: now.Add(2 * time.Hour), EndTime: now.Add(72 * time.Hour), IsActive: true}
		c4 := models.Campaign{ProductID: p4.ID, CampaignStock: 15, DiscountPercentage: 15, StartTime: now, EndTime: now.Add(96 * time.Hour), IsActive: true}
		c5 := models.Campaign{ProductID: p5.ID, CampaignStock: 8, DiscountPercentage: 20, StartTime: now, EndTime: now.Add(120 * time.Hour), IsActive: true}

		db.Create(&c1)
		db.Create(&c2)
		db.Create(&c3)
		db.Create(&c4)
		db.Create(&c5)

		rdb.Set(ctx, "stock:"+p1.ID.String(), p1.Stock, 0)
		rdb.Set(ctx, "stock:"+p2.ID.String(), p2.Stock, 0)
		rdb.Set(ctx, "stock:"+p3.ID.String(), p3.Stock, 0)
		rdb.Set(ctx, "stock:"+p4.ID.String(), p4.Stock, 0)
		rdb.Set(ctx, "stock:"+p5.ID.String(), p5.Stock, 0)

		log.Println("Seeding completed successfully!")
	}

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
	managerProducts.PUT("/:id", productHandler.Update)
	managerProducts.DELETE("/:id", productHandler.Delete)

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
