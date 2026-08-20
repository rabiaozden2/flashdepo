package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/rabiaozden2/flashdepo/backend/internal/models"
)

func setupTestDB() *gorm.DB {
	db, _ := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	db.AutoMigrate(&models.User{}, &models.Warehouse{}, &models.Product{}, &models.Campaign{}, &models.Order{})
	return db
}

func TestListCampaigns(t *testing.T) {
	db := setupTestDB()
	gin.SetMode(gin.TestMode)

	// Insert dummy data
	product := models.Product{
		Name:          "Test Product",
		OriginalPrice: 100,
		Stock:         10,
	}
	db.Create(&product)

	campaign := models.Campaign{
		ProductID:          product.ID,
		DiscountPercentage: 10,
		StartTime:          time.Now().Add(-1 * time.Hour), // Already started
		EndTime:            time.Now().Add(1 * time.Hour),  // Not ended yet
		IsActive:           true,
	}
	db.Create(&campaign)

	handler := &CampaignHandler{DB: db}
	router := gin.Default()
	router.GET("/campaigns", handler.List)

	t.Run("Returns 200 with campaigns", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/campaigns", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Expected status 200, got %d", w.Code)
		}

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)

		data, ok := response["data"].([]interface{})
		if !ok || len(data) != 1 {
			t.Fatalf("Expected 1 campaign, got %v", data)
		}
	})
}
