package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/rabiaozden2/flashdepo/backend/internal/models"
)

type OrderHandler struct {
	DB    *gorm.DB
	Redis *redis.Client
	Ws    *WsHandler
}

type CreateOrderRequest struct {
	CampaignID uuid.UUID `json:"campaign_id" binding:"required"`
	Quantity   int       `json:"quantity" binding:"required,min=1"`
}

type OrderMessage struct {
	OrderID    uuid.UUID `json:"order_id"`
	UserID     uuid.UUID `json:"user_id"`
	CampaignID uuid.UUID `json:"campaign_id"`
	ProductID  uuid.UUID `json:"product_id"`
	Quantity   int       `json:"quantity"`
	TotalPrice float64   `json:"total_price"`
}

// Create godoc
// @Summary Create a new order (Flash Sale)
// @Description Places an order and reserves stock via Redis atomic DECRBY
// @Tags Orders
// @Accept json
// @Produce json
// @Param request body CreateOrderRequest true "Order Info"
// @Success 202 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Security BearerAuth
// @Router /orders [post]
func (h *OrderHandler) Create(c *gin.Context) {
	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDRaw, _ := c.Get("user_id")
	userID := userIDRaw.(uuid.UUID)

	var campaign models.Campaign
	if err := h.DB.Preload("Product").Where("id = ? AND is_active = ?", req.CampaignID, true).First(&campaign).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found or inactive"})
		return
	}

	if time.Now().Before(campaign.StartTime) || time.Now().After(campaign.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Campaign is not currently active"})
		return
	}

	ctx := context.Background()
	reservationKey := fmt.Sprintf("campaign_stock:%s", campaign.ID.String())

	// If Redis key is missing or 0, init from Postgres
	currentStock, err := h.Redis.Get(ctx, reservationKey).Int()
	if err == redis.Nil || currentStock <= 0 {
		if campaign.CampaignStock > 0 {
			h.Redis.Set(ctx, reservationKey, campaign.CampaignStock, 0)
		}
	}

	// Decrement stock in Redis atomically
	remaining, err := h.Redis.DecrBy(ctx, reservationKey, int64(req.Quantity)).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check stock"})
		return
	}

	if remaining < 0 {
		h.Redis.IncrBy(ctx, reservationKey, int64(req.Quantity))
		c.JSON(http.StatusConflict, gin.H{"error": "Out of stock"})
		return
	}

	// Update DB campaign stock so REST queries reflect instant stock drop
	h.DB.Model(&models.Campaign{}).Where("id = ?", campaign.ID).UpdateColumn("campaign_stock", remaining)

	h.Ws.BroadcastMessage(map[string]interface{}{
		"type":       "STOCK_UPDATE",
		"campaignId": campaign.ID,
		"stock":      remaining,
	})

	discountedPrice := campaign.Product.OriginalPrice * (1 - (campaign.DiscountPercentage / 100))
	totalPrice := discountedPrice * float64(req.Quantity)

	order := models.Order{
		UserID:     userID,
		CampaignID: campaign.ID,
		Quantity:   req.Quantity,
		TotalPrice: totalPrice,
		Status:     "pending",
	}

	if err := h.DB.Create(&order).Error; err != nil {
		h.Redis.IncrBy(ctx, reservationKey, int64(req.Quantity))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	msg := OrderMessage{
		OrderID:    order.ID,
		UserID:     userID,
		CampaignID: campaign.ID,
		ProductID:  campaign.ProductID,
		Quantity:   req.Quantity,
		TotalPrice: totalPrice,
	}

	msgBytes, _ := json.Marshal(msg)
	if err := h.Redis.LPush(ctx, "process_queue", msgBytes).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to queue order processing"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message":  "Order received and is being processed",
		"order_id": order.ID,
	})
}

type BulkOrderRequest struct {
	Items []CreateOrderRequest `json:"items" binding:"required"`
}

// BulkCreate godoc
// @Summary Create multiple orders from cart
// @Router /orders/bulk [post]
func (h *OrderHandler) BulkCreate(c *gin.Context) {
	var req BulkOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDRaw, _ := c.Get("user_id")
	userID := userIDRaw.(uuid.UUID)

	ctx := context.Background()

	var successful []uuid.UUID
	var failed []map[string]interface{}

	for _, item := range req.Items {
		var campaign models.Campaign
		if err := h.DB.Preload("Product").Where("id = ? AND is_active = ?", item.CampaignID, true).First(&campaign).Error; err != nil {
			failed = append(failed, gin.H{"campaign_id": item.CampaignID, "error": "Campaign not found or inactive"})
			continue
		}

		if time.Now().Before(campaign.StartTime) || time.Now().After(campaign.EndTime) {
			failed = append(failed, gin.H{"campaign_id": item.CampaignID, "error": "Campaign is not currently active"})
			continue
		}

		reservationKey := fmt.Sprintf("campaign_stock:%s", campaign.ID.String())

		currentStock, err := h.Redis.Get(ctx, reservationKey).Int()
		if err == redis.Nil || currentStock <= 0 {
			if campaign.CampaignStock > 0 {
				h.Redis.Set(ctx, reservationKey, campaign.CampaignStock, 0)
			}
		}

		remaining, err := h.Redis.DecrBy(ctx, reservationKey, int64(item.Quantity)).Result()
		if err != nil {
			failed = append(failed, gin.H{"campaign_id": item.CampaignID, "error": "Failed to check stock"})
			continue
		}

		if remaining < 0 {
			h.Redis.IncrBy(ctx, reservationKey, int64(item.Quantity))
			failed = append(failed, gin.H{"campaign_id": item.CampaignID, "error": "Out of stock"})
			continue
		}

		// Update DB campaign stock so REST queries reflect instant stock drop
		h.DB.Model(&models.Campaign{}).Where("id = ?", campaign.ID).UpdateColumn("campaign_stock", remaining)

		h.Ws.BroadcastMessage(map[string]interface{}{
			"type":       "STOCK_UPDATE",
			"campaignId": campaign.ID,
			"stock":      remaining,
		})

		discountedPrice := campaign.Product.OriginalPrice * (1 - (campaign.DiscountPercentage / 100))
		totalPrice := discountedPrice * float64(item.Quantity)

		order := models.Order{
			UserID:     userID,
			CampaignID: campaign.ID,
			Quantity:   item.Quantity,
			TotalPrice: totalPrice,
			Status:     "pending",
		}

		if err := h.DB.Create(&order).Error; err != nil {
			h.Redis.IncrBy(ctx, reservationKey, int64(item.Quantity))
			failed = append(failed, gin.H{"campaign_id": item.CampaignID, "error": "Failed to create order"})
			continue
		}

		msg := OrderMessage{
			OrderID:    order.ID,
			UserID:     userID,
			CampaignID: campaign.ID,
			ProductID:  campaign.ProductID,
			Quantity:   item.Quantity,
			TotalPrice: totalPrice,
		}

		msgBytes, _ := json.Marshal(msg)
		if err := h.Redis.LPush(ctx, "process_queue", msgBytes).Err(); err == nil {
			successful = append(successful, order.ID)
		} else {
			failed = append(failed, gin.H{"campaign_id": item.CampaignID, "error": "Failed to queue order processing"})
		}
	}

	c.JSON(http.StatusAccepted, gin.H{
		"message":    "Bulk order processed",
		"successful": successful,
		"failed":     failed,
	})
}

// List godoc
// @Summary List user's orders
// @Description Get paginated list of current user's orders with campaign and product details
// @Tags Orders
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /orders [get]
func (h *OrderHandler) List(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDRaw.(uuid.UUID)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	var orders []models.Order
	var total int64

	query := h.DB.Model(&models.Order{}).Where("user_id = ?", userID)
	query.Count(&total)

	if err := query.Preload("Campaign.Product").Order("created_at DESC").Offset(offset).Limit(limit).Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": orders,
		"meta": gin.H{"total": total, "page": page, "limit": limit},
	})
}
