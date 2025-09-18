module Api
    module V1
      class TodosController < ApplicationController
        before_action :authenticate_user!
        before_action :set_todo, only: [:show, :update, :destroy]
  
        # GET /todos
        def index
          @todos = current_user.todos
          render json: @todos
        end
  
        # GET /todos/:id
        def show
          render json: @todo
        end
  
        # POST /todos
        def create
          @todo = current_user.todos.new(todo_params)
          if @todo.save
            render json: @todo, status: :created
          else
            render json: { errors: @todo.errors.full_messages }, status: :unprocessable_entity
          end
        end
  
        # PATCH/PUT /todos/:id
        def update
          if @todo.update(todo_params)
            render json: @todo
          else
            render json: { errors: @todo.errors.full_messages }, status: :unprocessable_entity
          end
        end
  
        # DELETE /todos/:id
        def destroy
          @todo.destroy
          head :no_content
        end
  
        private
  
        def set_todo
          @todo = current_user.todos.where(id: params[:id]).first
          return render json: { error: "Not Found" }, status: :not_found unless @todo
        end
  
        def todo_params
          params.require(:todo).permit(:title, :description, :completed, :due_date, :reminder_at, :priority)
        end
      end
    end
  end
  