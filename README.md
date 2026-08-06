# StockDine Backend API

Backend RESTful API service built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)** for StockDine Hub.

## 🚀 Features & Modules

- **Authentication & Authorization**: JWT token-based auth for customers, staff, and restaurant managers with role middleware.
- **Restaurant Management**: Restaurant profile setup, operating hours, seating, and logo uploads via Cloudinary.
- **Menu & Dish Management**: Category management, pricing, availability toggles, and dish image upload.
- **Table & Seating Management**: Real-time table status updates, QR code generation, and availability control.
- **Staff Management**: Role-based access control (Admin, Waiter, Kitchen Staff) and staff accounts.
- **Reviews & Feedback**: Customer review ratings and response management.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root of the backend folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/stockdine?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🛠️ Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Run in production mode**:
   ```bash
   npm start
   ```

---

## 🌐 API Routes Overview

| Base Endpoint | Description | Auth Required |
| :--- | :--- | :--- |
| `/api/auth` | User login, signup, and token verification | Public / Bearer Token |
| `/api/restaurant` | Restaurant setup, settings, and profile info | Restaurant Admin |
| `/api/dishes` | Menu items, dish categories, pricing, and availability | Mixed (Public/Admin) |
| `/api/tables` | Table layout, status, seating, and QR codes | Mixed (Public/Admin) |
| `/api/staff` | Staff member management and assignments | Restaurant Admin |
| `/api/reviews` | Customer ratings and reviews | Public / Customer |

---

## ☁️ Deployment

Configured for **Render** via `render.yaml`.
