module Api
  module V1
    class AuthController < ApplicationController
      # POST /api/v1/register
      def register
        user = User.new(user_params)
        if user.save
          token = encode_token({ user_id: user.id.to_s })
          render json: { token: token, user: { id: user.id.to_s, email: user.email } }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/login
      def login
        user = User.where(email: params[:email]).first
        unless user&.authenticate(params[:password])
          return render json: { error: "Invalid email or password" }, status: :unauthorized
        end
        token = encode_token({ user_id: user.id.to_s })
        render json: { token: token, user: { id: user.id.to_s, email: user.email } }
      end

      private

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation)
      end
    end
  end
end


