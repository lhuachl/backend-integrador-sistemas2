#![allow(non_snake_case)]

mod screens;
mod components;
mod hooks;

use dioxus::prelude::*;
use dioxus_logger::tracing;

#[derive(Clone, Routable, Debug, PartialEq, serde::Serialize, serde::Deserialize)]
enum Route {
    #[route("/")]
    HomePage {},
    #[route("/login")]
    LoginPage {},
    #[route("/signup")]
    SignupPage {},
    #[route("/app")]
    AppPage {},
}

fn main() {
    // Init logger
    dioxus_logger::init(tracing::Level::INFO).expect("failed to init logger");
    tracing::info!("starting app");
    launch(App);
}

fn App() -> Element {
    rsx! {
        Router::<Route> {}
    }
}

#[component]
fn HomePage() -> Element {
    rsx! {
        div { class: "min-h-screen flex items-center justify-center",
            div { class: "text-center",
                h1 { class: "text-2xl font-bold mb-4", "Welcome to FlowState" }
                Link { to: Route::LoginPage {}, class: "text-indigo-600 hover:text-indigo-500",
                    "Go to Login"
                }
                Link { to: Route::SignupPage {}, class: "text-indigo-600 hover:text-indigo-500 ml-4",
                    "Go to Sign Up"
                }
            }
        }
    }
}

#[component]
fn LoginPage() -> Element {
    screens::login::LoginScreen()
}

#[component]
fn SignupPage() -> Element {
    screens::signup::SignupScreen()
}

#[component]
fn AppPage() -> Element {
    screens::app::AppScreen()
}
