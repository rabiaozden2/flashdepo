package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Email        string    `json:"email" gorm:"uniqueIndex"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"` // admin, warehouse_manager, customer
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Warehouse struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Name      string     `json:"name"`
	ManagerID *uuid.UUID `json:"manager_id"`
	IsActive  bool       `json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type Product struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	WarehouseID   uuid.UUID `json:"warehouse_id"`
	Warehouse     Warehouse `json:"warehouse" gorm:"foreignKey:WarehouseID"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	OriginalPrice float64   `json:"original_price"`
	Stock         int       `json:"stock"`
	ImageURL      string    `json:"image_url"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Campaign struct {
	ID                 uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	ProductID          uuid.UUID `json:"product_id"`
	Product            Product   `json:"product" gorm:"foreignKey:ProductID"`
	CampaignStock      int       `json:"campaign_stock"`
	DiscountPercentage float64   `json:"discount_percentage"`
	StartTime          time.Time `json:"start_time"`
	EndTime            time.Time `json:"end_time"`
	IsActive           bool      `json:"is_active"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type Order struct {
	ID         uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	UserID     uuid.UUID `json:"user_id"`
	CampaignID uuid.UUID `json:"campaign_id"`
	Campaign   Campaign  `json:"campaign" gorm:"foreignKey:CampaignID"`
	Quantity   int       `json:"quantity"`
	TotalPrice float64   `json:"total_price"`
	Status     string    `json:"status"` // pending, completed, failed
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
