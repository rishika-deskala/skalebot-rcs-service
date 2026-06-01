# Testing Guide for Skalebot WCA Service

## Setup Complete ✅

The following folder structure has been created:

```
src/
├── controllers/        (API route handlers)
│   └── health.controller.ts
├── services/          (Business logic)
│   └── health.service.ts
├── modules/           (Feature modules)
│   └── health.module.ts
├── app.controller.ts  (Root controller)
├── app.service.ts     (Root service)
├── app.module.ts      (Root module - imports all modules)
└── main.ts            (Application entry point)
```

## Available Endpoints

### 1. **Health Check** (Welcome)
- **URL:** `GET http://localhost:3000/`
- **Description:** Welcome message
- **Response:**
  ```json
  {
    "message": "Welcome to WCA Service"
  }
  ```

### 2. **Health Status** (App Service)
- **URL:** `GET http://localhost:3000/health`
- **Description:** Service health status
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-06-01T00:00:00Z"
  }
  ```

### 3. **Health Check** (New Health Module)
- **URL:** `GET http://localhost:3000/health`
- **Description:** Detailed health check
- **Response:**
  ```json
  {
    "status": "Service is running",
    "timestamp": "2026-06-01T00:00:00Z"
  }
  ```

## How to Test

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run start:dev
```

The server will start on `http://localhost:3000` (default NestJS port)

### Step 3: Test the Endpoints

#### Using cURL:
```bash
# Test welcome endpoint
curl http://localhost:3000/

# Test health endpoint
curl http://localhost:3000/health
```

#### Using Postman:
1. Create a new GET request
2. Enter: `http://localhost:3000/`
3. Click **Send**
4. Repeat for `http://localhost:3000/health`

#### Using PowerShell:
```powershell
# Test welcome endpoint
Invoke-RestMethod -Uri "http://localhost:3000/" -Method GET

# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
```

### Step 4: View Swagger Documentation
- **URL:** `http://localhost:3000/skalebot-api-docs`
- All endpoints are documented with descriptions and examples

## Build for Production

```bash
npm run build
npm run start:prod
```

## Troubleshooting

If port 3000 is already in use, you can change it in `main.ts` or set environment variable:
```bash
$env:PORT=3001
npm run start:dev
```

## File Locations Reference

| File | Location | Purpose |
|------|----------|---------|
| Health Service | `src/services/health.service.ts` | Contains health check logic |
| Health Controller | `src/controllers/health.controller.ts` | Handles health endpoint |
| Health Module | `src/modules/health.module.ts` | Wires controller & service |
| App Module | `src/app.module.ts` | Imports all modules |
| Main Entry | `src/main.ts` | Bootstrap and configuration |

---

**Note:** Both the app controller and health module have health endpoints. You can customize or remove as needed based on your requirements.
