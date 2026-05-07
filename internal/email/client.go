package email

import (
	"context"
	"fmt"
	"html/template"
	"strings"

	"github.com/resendlabs/resend-go"
)

type Client struct {
	apiKey   string
	from     string
	templates map[string]*template.Template
}

func NewClient(apiKey, from string) *Client {
	return &Client{
		apiKey:   apiKey,
		from:     from,
		templates: make(map[string]*template.Template),
	}
}

func (c *Client) LoadTemplate(name, basePath, bodyPath string) error {
	t, err := template.ParseFiles(basePath, bodyPath)
	if err != nil {
		return err
	}
	c.templates[name] = t
	return nil
}

func (c *Client) SendConfirmation(ctx context.Context, to, name, confirmURL string) error {
	if c.apiKey == "" {
		fmt.Printf("[DEV MODE] Email to %s: Confirm at %s\n", to, confirmURL)
		return nil
	}

	body := new(strings.Builder)
	if t, ok := c.templates["confirmation"]; ok {
		data := map[string]string{"Name": name, "ConfirmURL": confirmURL}
		t.Execute(body, data)
	} else {
		body.WriteString(fmt.Sprintf("Hi %s,\n\nConfirm your email: %s\n\nThis link expires in 24 hours.", name, confirmURL))
	}

	client := resend.NewClient(c.apiKey)
	params := &resend.SendEmailRequest{
		From:    c.from,
		To:      []string{to},
		Subject: "Confirm your FLOWSTATE account",
		Html:    body.String(),
	}

	_, err := client.Emails.Send(params)
	return err
}