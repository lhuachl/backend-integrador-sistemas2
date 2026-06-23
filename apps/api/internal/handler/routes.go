package handler

import (
	"flowstate/api/internal/middleware"
	"flowstate/api/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func RegisterRoutes(
	r *gin.Engine,
	auth *service.AuthService,
	notes *service.NoteService,
	teams *service.TeamService,
	goals *service.GoalService,
	tasks *service.TaskService,
	notifs *service.NotificationService,
	graph *service.GraphService,
	users *service.UserService,
	jwtSecret string,
	logger *zap.Logger,
) {
	health := NewHealthHandler()
	authH := NewAuthHandler(auth, logger)
	noteH := NewNoteHandler(notes, logger)
	teamH := NewTeamHandler(teams)
	goalH := NewGoalHandler(goals)
	taskH := NewTaskHandler(tasks, logger)
	notifH := NewNotificationHandler(notifs)
	graphH := NewGraphHandler(graph)
	userH := NewUserHandler(users)

	r.GET("/healthz", health.Healthz)

	api := r.Group("/api/v1")

	authGroup := api.Group("/auth")
	{
		authGroup.POST("/register", authH.Register)
		authGroup.POST("/login", authH.Login)
		authGroup.POST("/google", authH.GoogleAuth)
		authGroup.POST("/verify-email", authH.VerifyEmail)
	}

	api.POST("/auth/refresh", authH.Refresh)

	authd := api.Group("")
	authd.Use(middleware.Auth(jwtSecret))
	{
		authd.GET("/auth/me", authH.Me)
		authd.POST("/auth/logout", authH.Logout)

		authd.GET("/notes", noteH.List)
		authd.POST("/notes", noteH.Create)
		authd.GET("/notes/:id", noteH.Get)
		authd.PATCH("/notes/:id", noteH.Update)
		authd.DELETE("/notes/:id", noteH.Delete)
		authd.GET("/notes/:id/links", noteH.ListLinks)
		authd.POST("/notes/:id/links", noteH.AddLink)
		authd.POST("/notes/:id/share", noteH.Share)

		authd.GET("/teams", teamH.List)
		authd.POST("/teams", teamH.Create)
		authd.GET("/teams/:id", teamH.Get)
		authd.GET("/teams/:id/members", teamH.ListMembers)
		authd.POST("/teams/:id/members", teamH.InviteMember)

		authd.GET("/goals", goalH.List)
		authd.POST("/goals", goalH.Create)
		authd.GET("/goals/:id", goalH.Get)
		authd.PATCH("/goals/:id", goalH.Update)
		authd.DELETE("/goals/:id", goalH.Delete)
		authd.POST("/goals/:id/progress", goalH.AddProgress)

		authd.GET("/tasks", taskH.List)
		authd.POST("/tasks", taskH.Create)
		authd.PATCH("/tasks/:id", taskH.Update)
		authd.DELETE("/tasks/:id", taskH.Delete)

		authd.GET("/graph", graphH.GetGraph)

		authd.GET("/notifications", notifH.List)
		authd.PATCH("/notifications", notifH.MarkRead)

		authd.GET("/users/:id", userH.Get)
		authd.PATCH("/users/me/profile", userH.UpdateProfile)
	}

	api.POST("/teams/:id/join", teamH.Join)
}
