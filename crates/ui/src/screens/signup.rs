use dioxus::prelude::*;
use crate::hooks::use_auth::{AuthState, AuthAction};
use crate::components::oauth_buttons::OAuthButtons;

#[component]
pub fn SignupScreen() -> Element {
    let (auth_state, auth_action) = crate::hooks::use_auth::use_auth();
    let mut email = use_signal(|| String::new());
    let mut password = use_signal(|| String::new());
    let mut confirm_password = use_signal(|| String::new());
    let mut password_error = use_signal(|| String::new());

    rsx! {
        div { class: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8",
            div { class: "max-w-md w-full space-y-8",
                div {
                    h2 { class: "mt-6 text-center text-3xl font-extrabold text-gray-900",
                        "Create your account"
                    }
                    p { class: "mt-2 text-center text-sm text-gray-600",
                        "Or "
                        a {
                            class: "font-medium text-indigo-600 hover:text-indigo-500",
                            href: "/login",
                            "sign in to your existing account"
                        }
                    }
                }

                // OAuth Buttons
                OAuthButtons { on_action: auth_action }

                div { class: "relative",
                    div { class: "absolute inset-0 flex items-center",
                        div { class: "w-full border-t border-gray-300" }
                    }
                    div { class: "relative flex justify-center text-sm",
                        span { class: "px-2 bg-gray-50 text-gray-500",
                            "Or continue with email"
                        }
                    }
                }

                // Email/Password Form
                form {
                    class: "mt-8 space-y-6",
                    onsubmit: move |e| {
                        e.prevent_default();
                        if password() != confirm_password() {
                            password_error.set("Passwords do not match".to_string());
                            return;
                        }
                        password_error.set(String::new());
                        auth_action.call(AuthAction::SignUp(email(), password()));
                    },
                    div { class: "rounded-md shadow-sm -space-y-px",
                        div {
                            label { class: "sr-only", "Email address" }
                            input {
                                class: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm",
                                r#type: "email",
                                placeholder: "Email address",
                                value: "{email}",
                                oninput: move |e| email.set(e.value()),
                                required: true,
                            }
                        }
                        div {
                            label { class: "sr-only", "Password" }
                            input {
                                class: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm",
                                r#type: "password",
                                placeholder: "Password",
                                value: "{password}",
                                oninput: move |e| password.set(e.value()),
                                required: true,
                            }
                        }
                        div {
                            label { class: "sr-only", "Confirm Password" }
                            input {
                                class: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm",
                                r#type: "password",
                                placeholder: "Confirm password",
                                value: "{confirm_password}",
                                oninput: move |e| confirm_password.set(e.value()),
                                required: true,
                            }
                        }
                    }

                    // Error messages
                    if !password_error.read().is_empty() {
                        div { class: "text-red-600 text-sm text-center",
                            "{password_error}"
                        }
                    }
                    if let AuthState::Error(err) = auth_state.read().clone() {
                        div { class: "text-red-600 text-sm text-center",
                            "{err}"
                        }
                    }

                    div {
                        button {
                            class: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                            r#type: "submit",
                            disabled: *auth_state.read() == AuthState::Loading,
                            if *auth_state.read() == AuthState::Loading {
                                "Creating account..."
                            } else {
                                "Create account"
                            }
                        }
                    }
                }
            }
        }
    }
}
