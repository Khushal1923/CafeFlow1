# CafeFlow | SaaS Restaurant & Cafe Management Platform

CafeFlow is a production-ready, multi-tenant SaaS restaurant platform featuring automated digital menus, table-specific dynamic QR codes, live socket-connected kitchen panels, responsive owner portals, and PDF bill generator services.

---

## 🚀 Directory Layout

```
cafe-qr-system/
├── backend/
│   ├── src/
│   │   ├── middleware/        # JWT Authentication & Role Guards
│   │   ├── models/            # Mongoose Schemas (Restaurant, User, Table, Dish, etc.)
│   │   ├── routes/            # REST API Endpoint Routers
│   │   ├── utils/             # PDF Generators, SMS OTP, QR Code Writers
│   │   ├── seed.ts            # DB Seeder for Sandbox Accounts
│   │   └── server.ts          # Core API & WebSocket Server
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js App Router (Layouts & Dashboards)
│   │   ├── components/        # Theme toggles & UI elements
│   │   ├── hooks/             # Socket connection hooks
│   │   ├── lib/               # Axios API clients
│   │   └── store/             # Zustand Cart & Auth Stores
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml         # Container Orchestration config
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router, Tailwind CSS, TypeScript, Zustand, Recharts, Framer Motion)
- **Backend**: Node.js, Express.js (TypeScript, Socket.io, PDFKit, QRCode, BcryptJS, JWT)
- **Database**: MongoDB (Mongoose schemas with indexing)
- **Security**: JWT tokens, password hashing, role-based controls (RBAC), sanitized database queries

---

## 🏁 Local Development Setup

### Prerequisites
Make sure you have Node.js (v18+) and MongoDB installed locally and running on port `27017`.

### Option A: Run via Docker (Recommended)
From the root workspace, run:
```bash
docker-compose up --build
```
This builds and starts MongoDB, the Express backend API on `http://localhost:5000`, and the Next.js frontend client on `http://localhost:3000`.

### Option B: Run Manually (Local Node Server)

1. **Database Seeding**:
   Open a terminal in the `backend/` folder:
   ```bash
   # Install dependencies
   npm install
   # Seed the database (SuperAdmin, Central Cafe, Tables, Dishes, Staff)
   npm run seed
   # Start the Express API in dev/watch mode
   npm run dev
   ```

2. **Start Frontend**:
   Open a secondary terminal in the `frontend/` folder:
   ```bash
   # Install dependencies
   npm install
   # Run the Next.js development server
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 🛠️ Sandbox Login Credentials

- **Super Admin Panel**: `superadmin@cafeflow.com` / `superadmin123`
- **Cafe Admin Dashboard**: `admin@centralcafe.com` / `admin123`
- **Kitchen / Staff Panel**: `staff@centralcafe.com` / `staff123`

---

## 📖 REST API Documentation

### 1. Authentication & Verification (`/api/auth`)
- `POST /register-restaurant`: Public sign up for cafe partners (creates Restaurant + Admin User).
- `POST /login`: Partner login, returns JWT token and role boundaries.
- `POST /otp/send`: Generates 6-digit verification code, triggers Twilio SMS (or prints to terminal console).
- `POST /otp/verify`: Confirms customer OTP status.
- `GET /me`: Returns details of active logged-in user.

### 2. Restaurant Profiles (`/api/restaurants`)
- `GET /`: Lists all restaurants (Super Admin only).
- `GET /slug/:slug`: Public details of restaurant (for landing and menu screens).
- `GET /my-restaurant`: Details of logged-in user's restaurant.
- `PATCH /my-restaurant`: Update profile details (logo, contact, address, taxRate).
- `PATCH /:id/status`: Suspends or activates a restaurant tenant (Super Admin only).

### 3. Menu Dishes (`/api/dishes`)
- `GET /slug/:slug`: Public endpoint to load menu dishes.
- `GET /restaurant/:restaurantId`: Public dishes by restaurant ID.
- `POST /`: Add new dish (Admin only).
- `PATCH /:id`: Edit dish particulars (Admin only).
- `PATCH /:id/toggle-availability`: Staff shortcut to flag out-of-stock items.
- `DELETE /:id`: Remove dish from menu catalog.

### 4. Table Management (`/api/tables`)
- `GET /`: Lists registered tables for logged-in cafe.
- `POST /`: Registers a table and generates its Table QR Code.
- `DELETE /:id`: Removes table (deactivates QR scans).

### 5. Order Management (`/api/orders`)
- `POST /`: Places customer table order (enforces verified OTP).
- `GET /my-restaurant`: Active orders list (Kitchen dashboard access).
- `GET /:id`: Customer status tracker retrieve.
- `PATCH /:id/status`: Workflow transitions (received -> accepted -> preparing -> ready -> served -> completed). Triggers PDF invoice generation when set to `completed`.

### 6. Billing System (`/api/bills`)
- `GET /order/:orderId`: Fetch invoice metadata for an order.
- `GET /my-restaurant`: Roster of completed settlements and financial stats.
- `GET /download/:filename`: Stream/Download invoice PDF files inline.

### 7. Dashboard Analytics (`/api/analytics`)
- `GET /overview`: Combined analytics for sales trend areas, top-selling bars, status counts, and core metric counts.
- `GET /peak-hours`: Hourly sales statistics.

### 8. Staff Roster (`/api/staff`)
- `GET /`: Lists staff roster.
- `POST /`: Registers new staff credentials.
- `PATCH /:id`: Edits staff member.
- `DELETE /:id`: Removes staff access.

---

## 📡 WebSockets Events (Socket.io)

### Room Subscriptions
- `join_restaurant(restaurantId)`: Subscribes device (dashboards, kitchen panel) to tenant-specific updates.
- `join_order(orderId)`: Subscribes customer tracking page to state updates.

### Broadcast dispatches
- `new_order`: Sent to restaurant room on new checkouts.
- `order_updated`: Sent to restaurant room when items shift states.
- `order_status_updated`: Sent to order room to update client progress bar.
- `bill_ready`: Sent to order room on completion containing invoice download URLs.
