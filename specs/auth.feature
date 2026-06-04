Feature: Authentication System
  As a FlowState user
  I want to authenticate with GitHub, Google, or email/password
  So that I can access my workspaces and pages securely

  Background:
    Given the InsForge auth service is configured
    And OAuth providers GitHub and Google are enabled
    And email verification is required via magic link
    And the backend Axum server runs on port 3100
    And the FLOWSTATE_API_URL environment variable is set

  # ============================================
  # OAuth - GitHub
  # ============================================

  Scenario: Start GitHub OAuth flow
    Given a user who is not authenticated
    When the user initiates GitHub OAuth
    Then the backend should generate a PKCE code verifier
    And the backend should store the verifier linked to a state parameter
    And the backend should return a GitHub authorization URL
    And the URL should contain client_id, redirect_uri, scope, state, code_challenge, and code_challenge_method

  Scenario: Complete GitHub OAuth callback
    Given the user has authorized the app on GitHub
    And the backend has a stored PKCE verifier for the state
    When GitHub redirects to /auth/callback with code and state parameters
    Then the backend should retrieve the stored verifier using the state
    And the backend should exchange the code and verifier with InsForge
    And InsForge should return access_token and refresh_token
    And the backend should return the tokens to the client
    And the stored verifier should be removed

  Scenario: OAuth callback with invalid state
    Given no PKCE verifier is stored for state "invalid_state"
    When GitHub redirects to /auth/callback with code and state "invalid_state"
    Then the backend should return a 400 error
    And the error message should indicate invalid state

  Scenario: OAuth callback with expired verifier
    Given a PKCE verifier was stored more than 10 minutes ago
    When GitHub redirects to /auth/callback with code and matching state
    Then the backend should return a 400 error
    And the error message should indicate expired verifier

  Scenario: OAuth denied by user
    Given a user who is not authenticated
    When the user initiates GitHub OAuth
    And the user denies authorization on GitHub
    Then GitHub should redirect to /auth/callback with error parameter
    And the backend should redirect to login page with error message

  # ============================================
  # OAuth - Google
  # ============================================

  Scenario: Start Google OAuth flow
    Given a user who is not authenticated
    When the user initiates Google OAuth
    Then the backend should generate a PKCE code verifier
    And the backend should return a Google authorization URL

  Scenario: Complete Google OAuth callback
    Given the user has authorized the app on Google
    When Google redirects to /auth/callback with code and state
    Then the backend should exchange the code for tokens
    And the user should be authenticated

  # ============================================
  # Email / Password - Registration
  # ============================================

  Scenario: Register with email and password
    Given a user with email "new@example.com" who is not registered
    When the user submits registration with password "SecurePass123!"
    Then InsForge should create the user account
    And InsForge should send a magic link verification email
    And the user should see "Check your email" message

  Scenario: Register with existing email
    Given a user with email "existing@example.com" is already registered
    When the user submits registration with that email
    Then the backend should return an error
    And the error should indicate the email is already registered

  Scenario: Register with weak password
    Given a user who is not registered
    When the user submits registration with password "123"
    Then the backend should return an error
    And the error should indicate password requirements

  # ============================================
  # Email / Password - Login
  # ============================================

  Scenario: Login with verified email
    Given a registered user with email "user@example.com" and password "secret123"
    And the user's email is verified via magic link
    When the user submits login with correct credentials
    Then InsForge should authenticate the user
    And the backend should receive access_token and refresh_token
    And the user should be authenticated

  Scenario: Login with unverified email
    Given a registered user with unverified email
    When the user submits login with correct credentials
    Then InsForge should return email_not_verified error
    And the user should see "Please verify your email" message

  Scenario: Login with wrong password
    Given a registered user with email "user@example.com"
    When the user submits login with wrong password
    Then InsForge should return invalid_credentials error
    And the user should see "Invalid email or password" message

  Scenario: Login with non-existent email
    Given no user with email "nobody@example.com" exists
    When the user submits login with that email
    Then InsForge should return invalid_credentials error
    And the user should see "Invalid email or password" message

  # ============================================
  # Email Verification via Magic Link
  # ============================================

  Scenario: Verify email with valid magic link
    Given a user who registered with email "new@example.com"
    And InsForge sent a magic link to that email
    When the user clicks the magic link
    Then InsForge should verify the email
    And the user should be redirected to /auth/verify with success status
    And the user should be logged in automatically

  Scenario: Verify email with expired magic link
    Given a user who registered with email "new@example.com"
    And the magic link has expired
    When the user clicks the expired magic link
    Then InsForge should reject the verification
    And the user should be redirected to /auth/verify with error status
    And the user should see "Link expired" message

  Scenario: Resend verification email
    Given a user who registered but has not verified their email
    When the user requests to resend verification email
    Then InsForge should send a new magic link
    And the user should see "Verification email sent" message

  # ============================================
  # Session Management - Logout
  # ============================================

  Scenario: Logout on mobile
    Given an authenticated user on mobile
    When the user clicks "Logout"
    Then the backend should revoke the session with InsForge
    And the Tauri secure storage should be cleared
    And the user should be redirected to login screen

  Scenario: Logout on web
    Given an authenticated user on web
    When the user clicks "Logout"
    Then the backend should revoke the session with InsForge
    And the auth cookies should be cleared
    And the user should be redirected to login page

  # ============================================
  # Token Refresh
  # ============================================

  Scenario: Refresh access token on mobile
    Given an authenticated user on mobile with expired access_token
    When the app makes an API request
    Then the app should detect the expired token
    And the app should call the backend refresh endpoint
    And the backend should use the refresh_token to get new tokens from InsForge
    And the backend should return new access_token and refresh_token
    And the Tauri secure storage should be updated
    And the original API request should proceed

  Scenario: Refresh with expired refresh token
    Given an authenticated user with expired refresh_token
    When the app tries to refresh the session
    Then InsForge should reject the refresh
    And the backend should return a 401 error
    And the app should clear stored tokens
    And the user should be redirected to login screen

  Scenario: Refresh access token on web
    Given an authenticated user on web with expired access_token
    When the frontend makes an API request
    Then the frontend should detect the 401 response
    And the frontend should call /auth/refresh with refresh cookie
    And the backend should return new tokens
    And the frontend should retry the original request
