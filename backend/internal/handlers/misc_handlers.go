package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/rabiaozden2/flashdepo/backend/internal/models"
)

type WarehouseHandler struct {
	DB *gorm.DB
}

// List godoc
// @Summary List all warehouses
// @Tags Warehouses
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /warehouses [get]
func (h *WarehouseHandler) List(c *gin.Context) {
	var warehouses []models.Warehouse
	if err := h.DB.Find(&warehouses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch warehouses"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": warehouses})
}

type UserHandler struct {
	DB *gorm.DB
}

// List godoc
// @Summary List all users (Admin only)
// @Tags Users
// @Produce json
// @Param page query int false "Page" default(1)
// @Param limit query int false "Limit" default(20)
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /users [get]
func (h *UserHandler) List(c *gin.Context) {
	var users []models.User
	if err := h.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": users})
}
