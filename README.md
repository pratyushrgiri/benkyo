# Benkyo

Minimal full-stack study concentration app using:
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express
- Storage: JSON files

## Run locally

1. Install backend dependencies:
   ```bash
   cd /home/runner/work/benkyo/benkyo/backend
   npm install
   ```
2. Start backend:
   ```bash
   npm start
   ```
3. Open frontend pages served by backend:
   - `http://localhost:5000/login.html`
   - `http://localhost:5000/register.html`
   - `http://localhost:5000/dashboard.html`

## API endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/sessions`
- `GET /api/sessions/:id`
- `POST /api/sessions`
- `GET /api/subjects`
- `POST /api/subjects`
- `DELETE /api/subjects/:id`
- `GET /api/stats`
- `GET /api/stats/activity`
- `GET /api/stats/weekly`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/user`
- `PUT /api/user`
