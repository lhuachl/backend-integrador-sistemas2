package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterSwagger(r *gin.Engine) {
	r.GET("/openapi.json", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/json", []byte(openapiSpec))
	})

	r.GET("/swagger/*any", func(c *gin.Context) {
		c.Header("Content-Type", "text/html; charset=utf-8")
		c.String(http.StatusOK, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FlowState API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body style="margin:0">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" })</script>
</body>
</html>`)
	})
}

const openapiSpec = `{
  "openapi": "3.0.3",
  "info": { "title": "FlowState API", "version": "1.0.0" },
  "servers": [{ "url": "/api/v1" }],
  "paths": {
    "/auth/register": { "post": { "summary": "Register", "tags": ["Auth"], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "email": { "type": "string" }, "password": { "type": "string" }, "name": { "type": "string" } }, "required": ["email","password"] } } } }, "responses": { "201": { "description": "Registered" } } } },
    "/auth/login": { "post": { "summary": "Login", "tags": ["Auth"], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "email": { "type": "string" }, "password": { "type": "string" } }, "required": ["email","password"] } } } }, "responses": { "200": { "description": "OK" } } } },
    "/auth/google": { "post": { "summary": "Google OAuth", "tags": ["Auth"], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "token": { "type": "string" } } } } } }, "responses": { "200": { "description": "OK" } } } },
    "/auth/verify-email": { "post": { "summary": "Verify email", "tags": ["Auth"], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "token": { "type": "string" } } } } } }, "responses": { "200": { "description": "OK" } } } },
    "/auth/refresh": { "post": { "summary": "Refresh token", "tags": ["Auth"], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "refresh_token": { "type": "string" } } } } } }, "responses": { "200": { "description": "OK" } } } },
    "/auth/me": { "get": { "summary": "Current user", "tags": ["Auth"], "security": [{ "Bearer": [] }], "responses": { "200": { "description": "OK" } } } },
    "/auth/logout": { "post": { "summary": "Logout", "tags": ["Auth"], "security": [{ "Bearer": [] }], "responses": { "200": { "description": "OK" } } } },
    "/notes": { "get": { "summary": "List notes", "tags": ["Notes"], "security": [{ "Bearer": [] }], "responses": { "200": { "description": "OK" } } }, "post": { "summary": "Create note", "tags": ["Notes"], "security": [{ "Bearer": [] }], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "title": { "type": "string" }, "content": { "type": "string" }, "tags": { "type": "array", "items": { "type": "string" } } }, "required": ["title"] } } } }, "responses": { "201": { "description": "Created" } } } },
    "/notes/{id}": { "get": { "summary": "Get note", "tags": ["Notes"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } }, "patch": { "summary": "Update note", "tags": ["Notes"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } }, "delete": { "summary": "Delete note", "tags": ["Notes"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "204": { "description": "Deleted" } } } },
    "/notes/{id}/links": { "get": { "summary": "List links", "tags": ["Notes"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } }, "post": { "summary": "Add link", "tags": ["Notes"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "201": { "description": "Created" } } } },
    "/notes/{id}/share": { "post": { "summary": "Share note", "tags": ["Notes"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } } },
    "/teams": { "get": { "summary": "List teams", "tags": ["Teams"], "security": [{ "Bearer": [] }], "responses": { "200": { "description": "OK" } } }, "post": { "summary": "Create team", "tags": ["Teams"], "security": [{ "Bearer": [] }], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "name": { "type": "string" }, "description": { "type": "string" } }, "required": ["name"] } } } }, "responses": { "201": { "description": "Created" } } } },
    "/teams/{id}": { "get": { "summary": "Get team", "tags": ["Teams"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } } },
    "/teams/{id}/members": { "get": { "summary": "List members", "tags": ["Teams"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } }, "post": { "summary": "Invite member", "tags": ["Teams"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "201": { "description": "Created" } } } },
    "/teams/{id}/join": { "post": { "summary": "Join team", "tags": ["Teams"], "responses": { "200": { "description": "OK" } } } },
    "/goals": { "get": { "summary": "List goals", "tags": ["Goals"], "security": [{ "Bearer": [] }], "responses": { "200": { "description": "OK" } } }, "post": { "summary": "Create goal", "tags": ["Goals"], "security": [{ "Bearer": [] }], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "title": { "type": "string" }, "current": { "type": "number" }, "target": { "type": "number" }, "unit": { "type": "string" }, "deadline": { "type": "string", "format": "date" } }, "required": ["title","target"] } } } }, "responses": { "201": { "description": "Created" } } } },
    "/goals/{id}": { "get": { "summary": "Get goal", "tags": ["Goals"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } }, "patch": { "summary": "Update goal", "tags": ["Goals"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } }, "delete": { "summary": "Delete goal", "tags": ["Goals"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "204": { "description": "Deleted" } } } },
    "/goals/{id}/progress": { "post": { "summary": "Add progress", "tags": ["Goals"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "amount": { "type": "number" } }, "required": ["amount"] } } } }, "responses": { "200": { "description": "OK" } } } },
    "/tasks": { "get": { "summary": "List tasks", "tags": ["Tasks"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "status", "in": "query", "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } }, "post": { "summary": "Create task", "tags": ["Tasks"], "security": [{ "Bearer": [] }], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "title": { "type": "string" }, "status": { "type": "string" }, "goal_id": { "type": "string" }, "due_date": { "type": "string", "format": "date" } }, "required": ["title"] } } } }, "responses": { "201": { "description": "Created" } } } },
    "/tasks/{id}": { "patch": { "summary": "Update task", "tags": ["Tasks"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } }, "delete": { "summary": "Delete task", "tags": ["Tasks"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "204": { "description": "Deleted" } } } },
    "/graph": { "get": { "summary": "Knowledge graph", "tags": ["Graph"], "security": [{ "Bearer": [] }], "responses": { "200": { "description": "OK" } } } },
    "/notifications": { "get": { "summary": "List", "tags": ["Notifications"], "security": [{ "Bearer": [] }], "responses": { "200": { "description": "OK" } } }, "patch": { "summary": "Mark read", "tags": ["Notifications"], "security": [{ "Bearer": [] }], "responses": { "200": { "description": "OK" } } } },
    "/users/{id}": { "get": { "summary": "Get user", "tags": ["Users"], "security": [{ "Bearer": [] }], "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }], "responses": { "200": { "description": "OK" } } } },
    "/users/me/profile": { "patch": { "summary": "Update profile", "tags": ["Users"], "security": [{ "Bearer": [] }], "requestBody": { "content": { "application/json": { "schema": { "type": "object", "properties": { "name": { "type": "string" }, "avatar_url": { "type": "string" } } } } } }, "responses": { "200": { "description": "OK" } } } }
  },
  "components": { "securitySchemes": { "Bearer": { "type": "http", "scheme": "bearer", "bearerFormat": "JWT" } } }
}`
