package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/rabiaozden2/flashdepo/backend/internal/models"
)

type ProductHandler struct {
	DB *gorm.DB
}

type CreateProductRequest struct {
	WarehouseID   uuid.UUID `json:"warehouse_id" binding:"required"`
	Name          string    `json:"name" binding:"required"`
	Description   string    `json:"description"`
	OriginalPrice float64   `json:"original_price" binding:"required,min=0"`
	Stock         int       `json:"stock" binding:"required,min=0"`
	ImageURL      string    `json:"image_url"`
}

// List godoc
// @Summary List all products
// @Tags Products
// @Produce json
// @Param page query int false "Page" default(1)
// @Param limit query int false "Limit" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /products [get]
func (h *ProductHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var products []models.Product
	var total int64

	h.DB.Model(&models.Product{}).Count(&total)
	if err := h.DB.Preload("Warehouse").Offset(offset).Limit(limit).Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": products,
		"meta": gin.H{"total": total, "page": page, "limit": limit},
	})
}

// Create godoc
// @Summary Create a new product (Warehouse Manager or Admin)
// @Tags Products
// @Accept json
// @Produce json
// @Param request body CreateProductRequest true "Product Info"
// @Success 201 {object} models.Product
// @Security BearerAuth
// @Router /products [post]
func (h *ProductHandler) Create(c *gin.Context) {
	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var warehouse models.Warehouse
	if err := h.DB.First(&warehouse, req.WarehouseID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Warehouse not found"})
		return
	}

	product := models.Product{
		WarehouseID:   req.WarehouseID,
		Name:          req.Name,
		Description:   req.Description,
		OriginalPrice: req.OriginalPrice,
		Stock:         req.Stock,
		ImageURL:      req.ImageURL,
	}

	if err := h.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	c.JSON(http.StatusCreated, product)
}

// Autofill simulates an AI that fetches product details from the web
// @Router /products/autofill [get]
func (h *ProductHandler) Autofill(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "q parameter is required"})
		return
	}

	searchURL := "https://dummyjson.com/products/search?q=" + query
	resp, err := http.Get(searchURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch from web"})
		return
	}
	defer resp.Body.Close()

	var result struct {
		Products []struct {
			Title       string  `json:"title"`
			Description string  `json:"description"`
			Price       float64 `json:"price"`
			Thumbnail   string  `json:"thumbnail"`
			Stock       int     `json:"stock"`
		} `json:"products"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse web response"})
		return
	}

	if len(result.Products) > 0 {
		p := result.Products[0]
		c.JSON(http.StatusOK, gin.H{
			"name":           p.Title,
			"description":    "Yapay Zeka (AI) web tarama sonucu: " + p.Description,
			"original_price": p.Price * 35.0, // Convert to approx TL
			"stock":          p.Stock,
			"image_url":      p.Thumbnail,
		})
		return
	}

	// Fallback if no product found on DummyJSON
	c.JSON(http.StatusOK, gin.H{
		"name":           query,
		"description":    "Yapay Zeka (AI) web tarama sonucu: " + query + " için internette görsel bulunamadı.",
		"original_price": 5499.00,
		"stock":          50,
		"image_url":      "https://loremflickr.com/800/800/" + query,
	})
}
