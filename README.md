# Todo API

Rails API using Mongoid with a simple `Todo` model and a built-in static frontend.

## Running locally

1. Install gems
   - `bundle install`
2. Start the server
   - `bin/rails server`
3. Open the frontend
   - Visit `http://localhost:3000/`

## API endpoints

- GET `/api/v1/todos`
- GET `/api/v1/todos/:id`
- POST `/api/v1/todos` with body `{ todo: { title, description?, completed? } }`
- PATCH `/api/v1/todos/:id` with body `{ todo: { ... } }`
- DELETE `/api/v1/todos/:id`

## Notes

- CORS enabled for `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`.
- Static frontend assets: `public/index.html`, `public/app.js`, `public/styles.css`.
