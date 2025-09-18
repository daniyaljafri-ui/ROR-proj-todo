class ApplicationController < ActionController::API
  private

  def jwt_secret
    Rails.application.credentials.jwt_secret || ENV["JWT_SECRET"] || "development-secret-change-me"
  end

  def encode_token(payload)
    JWT.encode(payload, jwt_secret, "HS256")
  end

  def decoded_token
    header = request.headers["Authorization"]
    return nil unless header&.start_with?("Bearer ")
    token = header.split(" ", 2)[1]
    JWT.decode(token, jwt_secret, true, { algorithm: "HS256" })
  rescue JWT::DecodeError
    nil
  end

  def current_user
    return @current_user if defined?(@current_user)
    data = decoded_token
    @current_user = data ? User.where(id: data[0]["user_id"]).first : nil
  end

  def authenticate_user!
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end
end
