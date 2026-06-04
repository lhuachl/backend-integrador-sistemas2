use dioxus::prelude::*;
use crate::hooks::use_auth::AuthAction;

#[component]
pub fn AppScreen() -> Element {
    let (auth_state, auth_action) = crate::hooks::use_auth::use_auth();

    rsx! {
        div { class: "min-h-screen bg-gray-100",
            // Navigation
            nav { class: "bg-white shadow-sm",
                div { class: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                    div { class: "flex justify-between h-16",
                        div { class: "flex",
                            div { class: "flex-shrink-0 flex items-center",
                                h1 { class: "text-xl font-bold text-indigo-600",
                                    "FlowState"
                                }
                            }
                        }
                        div { class: "flex items-center",
                            button {
                                class: "ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700",
                                onclick: move |_| auth_action.call(AuthAction::Logout),
                                "Logout"
                            }
                        }
                    }
                }
            }

            // Main content
            main { class: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8",
                div { class: "px-4 py-6 sm:px-0",
                    div { class: "border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center",
                        div { class: "text-center",
                            h2 { class: "text-2xl font-bold text-gray-900 mb-4",
                                "Welcome to FlowState"
                            }
                            p { class: "text-gray-600",
                                "You are logged in!"
                            }
                            p { class: "text-sm text-gray-500 mt-2",
                                "Status: {auth_state:?}"
                            }
                        }
                    }
                }
            }
        }
    }
}
