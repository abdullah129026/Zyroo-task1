# Backend System

A clean, extensible **Node.js + Express.js** backend foundation for the Internship
project. It comes with a running Express server, a connected **MongoDB**
database (via Mongoose), an organized folder structure, and basic safety
features — ready for future features to be built on
top of it.

---

## ✨ Features

- **Express.js** server with a structured, scalable folder layout
- **MongoDB** connection via Mongoose with a success message and graceful
  error handling (no uncontrolled crashes)
- **CORS** support so a frontend can talk to the API
- **Request logger** middleware that records every incoming request
- **Global error handler** that returns clean, consistent JSON errors
- **404 handler** for unknown routes
- **`GET /api/health`** endpoint to verify the server + database are healthy
- Sensitive values (database URI, port, API keys) kept in a `.env` file — never
  hardcoded and never committed to Git

---


## 🧱 Project Structure

```
cortex-ai-backend/
├── routes/               # Route definitions (mounted under /api)
│   ├── index.js
│   └── health.routes.js
├── controllers/          # Request handlers / business logic glue
│   └── health.controller.js
├── models/               # Mongoose schemas & models (empty for now)
├── config/               # Configuration modules (db, cors, env)
│   ├── db.js
│   └── cors.js
├── middleware/           # Custom middlewares
│   ├── request-logger.js
│   └── error-handler.js
├── utils/                # Small reusable helpers
│   └── api-response.js
├── app.js                # Express app setup (middlewares + routes)
├── server.js             # Entry point (connects DB, starts server)
├── .env                  # Environment variables (NOT committed)
├── .env.example          # Template for .env
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Tool            | Purpose                        |
| --------------- | ------------------------------ |
| Node.js         | JavaScript runtime             |
| Express.js      | Web framework                  |
| MongoDB         | Database (via MongoDB Atlas)  |
| Mongoose        | ODM for MongoDB                |
| dotenv          | Loads `.env` variables         |
| cors            | Cross-origin resource sharing  |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** (comes with Node.js)
- A **MongoDB** database — either [MongoDB Atlas](https://www.mongodb.com/atlas)
  or a local MongoDB instance
- [Postman](https://www.postman.com/) (or any API testing tool)

### 1. Clone & install

```bash
git clone https://github.com/abdullah129026/Zyroo-task1.git
cd Zyroo-task1/cortex-ai-backend
npm install
```

### 2. Configure environment variables

Copy the template and fill in your values:

```bash
cp .env.example .env
```

`.env` should look like this (values shown are examples only):

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@<cluster>.mongodb.net/<db_name>?retryWrites=true&w=majority
```

> ⚠️ **Never commit `.env`.** It is already excluded via `.gitignore`.

### 3. Run the server

```bash
npm run dev     # development (auto-restarts on file changes)
# or
npm start       # production-style start
```

Expected output:

```
[DB] MongoDB connected successfully (host: abdullah.4bclmmk.mongodb.net)
[SERVER] Cortex AI API is running at http://localhost:3001
```

### 4. Test the health endpoint

Open your browser, **Postman**, or curl:

```bash
curl http://localhost:3001/api/health
```

Expected JSON response:

```json
{
  "success": true,
  "message": "Server is running properly",
  "data": {
    "status": "ok",
    "service": "cortex-ai-backend",
    "environment": "development",
    "database": "connected",
    "uptimeSeconds": 12,
    "timestamp": "2026-08-29T10:00:00.000Z"
  }
}
```

---

## 📡 API Endpoints

| Method | Endpoint       | Description                              |
| ------ | -------------- | ---------------------------------------- |
| GET    | `/api/health`  | Server & database health check           |

---

## ⚙️ Environment Variables

| Variable      | Required | Description                                              |
| ------------- | -------- | -------------------------------------------------------- |
| `PORT`        | No       | Port the server listens on (default: `3001`)             |
| `NODE_ENV`    | No       | `development` / `production` (default: `development`)    |
| `CORS_ORIGIN` | No       | Comma-separated allowed origins, or `*` for all (default: `*`) |
| `MONGODB_URI` | Yes      | MongoDB connection string                                |

---

## 📚 npm Scripts

| Script          | Description                             |
| --------------- | --------------------------------------- |
| `npm start`     | Run the server                          |
| `npm run dev`   | Run the server with auto-restart (`node --watch`) |

---

## 🔒 Safety Notes

- Secrets live in `.env` only — never hardcoded in source.
- `.env` and `node_modules/` are excluded from Git.
- Global error middleware ensures clients always get a consistent JSON
  response (stack traces are hidden in production).
- A request logger tracks method, URL, status and duration for every request.

---

## 🤝 Contributing / Roadmap

This week's scope is only the core backend foundation — no AI features yet.
Future work (models, auth, AI endpoints) will plug into the existing
`routes` → `controllers` → `models` pipeline.
