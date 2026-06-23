package handler

import (
	"net/http"

	"flowstate/api/internal/model"

	"github.com/gin-gonic/gin"
)

func ok(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, data)
}

func created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, data)
}

func noContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func notFound(c *gin.Context) {
	c.JSON(http.StatusNotFound, gin.H{"error": model.APIError{Code: "not_found", Message: "resource not found"}})
}

func unauthorized(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, gin.H{"error": model.APIError{Code: "unauthorized", Message: "invalid credentials"}})
}

func forbidden(c *gin.Context) {
	c.JSON(http.StatusForbidden, gin.H{"error": model.APIError{Code: "forbidden", Message: "access denied"}})
}

func conflict(c *gin.Context) {
	c.JSON(http.StatusConflict, gin.H{"error": model.APIError{Code: "conflict", Message: "resource already exists"}})
}

func badRequest(c *gin.Context, msg string) {
	c.JSON(http.StatusBadRequest, gin.H{"error": model.APIError{Code: "validation_error", Message: msg}})
}

func internalError(c *gin.Context) {
	c.JSON(http.StatusInternalServerError, gin.H{"error": model.APIError{Code: "internal_error", Message: "internal server error"}})
}

func requireVerification(c *gin.Context) {
	c.JSON(http.StatusForbidden, gin.H{"error": model.APIError{Code: "verification_required", Message: "email not verified"}})
}

func notImplemented(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": model.APIError{Code: "not_implemented", Message: "not implemented yet"}})
}
