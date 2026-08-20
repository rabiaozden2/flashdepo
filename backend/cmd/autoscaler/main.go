package main

import (
	"context"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

// In a real application, we would use the Docker SDK (github.com/docker/docker/client)
// to scale docker-compose services or kubernetes deployments.
// For this staj odevi (internship task), we will simulate the autoscaler's 
// scale-up/scale-down decisions in the logs based on queue length.
// The actual scaling requires modifying the host's docker daemon which is complex inside a container
// unless the socket is fully bound and docker CLI is installed.

func main() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	rdb := redis.NewClient(&redis.Options{Addr: redisURL})

	minWorkers, _ := strconv.Atoi(os.Getenv("MIN_WORKERS"))
	if minWorkers <= 0 {
		minWorkers = 2
	}
	maxWorkers, _ := strconv.Atoi(os.Getenv("MAX_WORKERS"))
	if maxWorkers <= 0 {
		maxWorkers = 4
	}

	currentReplicas := minWorkers

	log.Printf("Autoscaler started. Min: %d, Max: %d\n", minWorkers, maxWorkers)

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		ctx := context.Background()
		
		// Check process queue length
		length, err := rdb.LLen(ctx, "process_queue").Result()
		if err != nil {
			log.Printf("Failed to get queue length: %v\n", err)
			continue
		}

		desiredReplicas := currentReplicas
		if length > 100 {
			desiredReplicas = maxWorkers
		} else if length > 50 {
			desiredReplicas = minWorkers + 1
		} else if length < 10 {
			desiredReplicas = minWorkers
		}

		if desiredReplicas > maxWorkers {
			desiredReplicas = maxWorkers
		}
		if desiredReplicas < minWorkers {
			desiredReplicas = minWorkers
		}

		if desiredReplicas != currentReplicas {
			log.Printf("[AUTOSCALER] Scaling Process Worker from %d to %d (Queue length: %d)\n", currentReplicas, desiredReplicas, length)
			
			// Simulate Docker scale command execution
			// err := exec.Command("docker", "service", "scale", fmt.Sprintf("flashdepo_worker=%d", desiredReplicas)).Run()
			
			currentReplicas = desiredReplicas
		} else {
			log.Printf("[AUTOSCALER] Queue length: %d. No scaling needed. Current replicas: %d\n", length, currentReplicas)
		}
	}
}
