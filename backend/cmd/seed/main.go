package main

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Email        string    `gorm:"uniqueIndex"`
	PasswordHash string
	Role         string
	IsActive     bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type Warehouse struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Name      string
	ManagerID *uuid.UUID
	IsActive  bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Product struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	WarehouseID   uuid.UUID
	Name          string
	Description   string
	OriginalPrice float64
	Stock         int
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type Campaign struct {
	ID                 uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ProductID          uuid.UUID
	DiscountPercentage float64
	StartTime          time.Time
	EndTime            time.Time
	IsActive           bool
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

func main() {
	dsn := "postgres://root:secretpassword@127.0.0.1:15432/flashdepo?sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	hashPassword := func(password string) string {
		hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		return string(hash)
	}

	admin := User{Email: "admin@flashdepo.com", PasswordHash: hashPassword("admin123"), Role: "admin", IsActive: true}
	manager1 := User{Email: "manager1@flashdepo.com", PasswordHash: hashPassword("manager123"), Role: "warehouse_manager", IsActive: true}
	manager2 := User{Email: "manager2@flashdepo.com", PasswordHash: hashPassword("manager123"), Role: "warehouse_manager", IsActive: true}
	customer := User{Email: "customer@flashdepo.com", PasswordHash: hashPassword("customer123"), Role: "customer", IsActive: true}

	db.Create(&admin)
	db.Create(&manager1)
	db.Create(&manager2)
	db.Create(&customer)

	w1 := Warehouse{Name: "Istanbul Depo", ManagerID: &manager1.ID, IsActive: true}
	w2 := Warehouse{Name: "Ankara Depo", ManagerID: &manager2.ID, IsActive: true}

	db.Create(&w1)
	db.Create(&w2)

	p1 := Product{WarehouseID: w1.ID, Name: "iPhone 15", Description: "Apple iPhone 15 128GB", OriginalPrice: 50000, Stock: 100}
	p2 := Product{WarehouseID: w2.ID, Name: "MacBook Air", Description: "Apple M2 MacBook Air", OriginalPrice: 40000, Stock: 50}

	db.Create(&p1)
	db.Create(&p2)

	c1 := Campaign{ProductID: p1.ID, DiscountPercentage: 20, StartTime: time.Now(), EndTime: time.Now().Add(24 * time.Hour), IsActive: true}
	c2 := Campaign{ProductID: p2.ID, DiscountPercentage: 15, StartTime: time.Now().Add(1 * time.Hour), EndTime: time.Now().Add(48 * time.Hour), IsActive: true}

	db.Create(&c1)
	db.Create(&c2)

	// Sync stock to Redis
	rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:6379"})
	ctx := context.Background()
	rdb.Set(ctx, "stock:"+p1.ID.String(), p1.Stock, 0)
	rdb.Set(ctx, "stock:"+p2.ID.String(), p2.Stock, 0)

	log.Println("Seed verileri basariyla eklendi!")
}
