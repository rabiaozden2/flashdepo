package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/rabiaozden2/flashdepo/backend/internal/models"
)

type CampaignHandler struct {
	DB *gorm.DB
}

type CreateCampaignRequest struct {
	ProductID          uuid.UUID `json:"product_id" binding:"required"`
	CampaignStock      int       `json:"campaign_stock" binding:"required,min=1"`
	DiscountPercentage float64   `json:"discount_percentage" binding:"required,min=1,max=99"`
	StartTime          time.Time `json:"start_time" binding:"required"`
	EndTime            time.Time `json:"end_time" binding:"required"`
}

type UpdateCampaignRequest struct {
	CampaignStock      *int       `json:"campaign_stock"`
	DiscountPercentage *float64   `json:"discount_percentage"`
	StartTime          *time.Time `json:"start_time"`
	EndTime            *time.Time `json:"end_time"`
	IsActive           *bool      `json:"is_active"`
}

// List godoc
// @Summary List active campaigns
// @Description Get a paginated list of active flash sale campaigns with product info
// @Tags Campaigns
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /campaigns [get]
func (h *CampaignHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit <= 0 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	var campaigns []models.Campaign
	var total int64

	query := h.DB.Model(&models.Campaign{}).Where("is_active = ?", true)
	query.Count(&total)

	if err := query.Preload("Product").Offset(offset).Limit(limit).Find(&campaigns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch campaigns"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": campaigns,
		"meta": gin.H{"total": total, "page": page, "limit": limit},
	})
}

// Create godoc
// @Summary Create a new campaign (Admin only)
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param request body CreateCampaignRequest true "Campaign Info"
// @Success 201 {object} models.Campaign
// @Security BearerAuth
// @Router /campaigns [post]
func (h *CampaignHandler) Create(c *gin.Context) {
	var req CreateCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var product models.Product
	if err := h.DB.First(&product, req.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	campaign := models.Campaign{
		ProductID:          req.ProductID,
		CampaignStock:      req.CampaignStock,
		DiscountPercentage: req.DiscountPercentage,
		StartTime:          req.StartTime,
		EndTime:            req.EndTime,
		IsActive:           true,
	}

	if err := h.DB.Create(&campaign).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create campaign"})
		return
	}

	h.DB.Preload("Product").First(&campaign, campaign.ID)
	c.JSON(http.StatusCreated, campaign)
}

// Update godoc
// @Summary Update a campaign (Admin only)
// @Tags Campaigns
// @Accept json
// @Produce json
// @Param id path string true "Campaign ID"
// @Param request body UpdateCampaignRequest true "Update fields"
// @Success 200 {object} models.Campaign
// @Security BearerAuth
// @Router /campaigns/{id} [put]
func (h *CampaignHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	var campaign models.Campaign
	if err := h.DB.First(&campaign, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campaign not found"})
		return
	}

	var req UpdateCampaignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.CampaignStock != nil {
		updates["campaign_stock"] = *req.CampaignStock
	}
	if req.DiscountPercentage != nil {
		updates["discount_percentage"] = *req.DiscountPercentage
	}
	if req.StartTime != nil {
		updates["start_time"] = *req.StartTime
	}
	if req.EndTime != nil {
		updates["end_time"] = *req.EndTime
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if err := h.DB.Model(&campaign).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update campaign"})
		return
	}

	h.DB.Preload("Product").First(&campaign, campaign.ID)
	c.JSON(http.StatusOK, campaign)
}

// Delete godoc
// @Summary Delete a campaign (Admin only)
// @Tags Campaigns
// @Param id path string true "Campaign ID"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /campaigns/{id} [delete]
func (h *CampaignHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	if _, err := uuid.Parse(idStr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid campaign ID"})
		return
	}

	// Delete related orders first via raw SQL
	h.DB.Exec("DELETE FROM orders WHERE campaign_id = ?", idStr)

	// Delete campaign via raw SQL
	if err := h.DB.Exec("DELETE FROM campaigns WHERE id = ?", idStr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete campaign"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Campaign deleted successfully"})
}
