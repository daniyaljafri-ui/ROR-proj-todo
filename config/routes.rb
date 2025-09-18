Rails.application.routes.draw do
  # Health check endpoint
  get "up", to: ->(_env) { [200, { "Content-Type" => "text/plain" }, ["ok"]] }
  namespace :api do
    namespace :v1 do
      post "register", to: "auth#register"
      post "login", to: "auth#login"
      resources :todos
    end
  end
end
