# 🌊 FinFlow

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)](https://neon.tech/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**FinFlow** is a premium, full-stack personal finance management platform designed to help users master their money with ease. Featuring a stunning "Midnight Graphite" aesthetic, real-time analytics, and advanced AI-powered tools, it elevates simple expense tracking into a professional financial command center.

---

## ✨ Key Features

### 🚀 Core Management
- **Smart Dashboard**: Real-time overview of monthly income, expenses, and current balance.
- **Transaction Tracking**: Detailed logging of every transaction with categories, dates, and descriptions.
- **Budgeting Engine**: Set per-category monthly limits and track your spending progress with visual progress bars.

### 💎 Premium "Pro" Features
- **🔁 Recurring Subscriptions**: Automatically track your Netflix, Spotify, or Rent. FinFlow evaluates and generates due transactions every time you log in.
- **🎯 Savings Goals**: Visual trackers for your life milestones (e.g., "New Car", "Emergency Fund") with customizable color themes.
- **📷 AI Receipt Scanning**: Built-in OCR (Optical Character Recognition) using Tesseract.js. Snap a photo of a receipt, and FinFlow automatically extracts the total amount.
- **📊 CSV Import & Export**: Move your data freely. Export filtered views or import entire bank statements in seconds.
- **🤖 Smart Auto-Categorization**: Custom rules engine that maps descriptions like "Starbucks" to "Food & Dining" automatically based on your keywords.
- **💱 Multi-Currency Support**: Real-time exchange rates via Frankfurter API. View your net worth in your preferred currency (default: INR ₹).
- **⚙️ Bulk Operations**: Advanced filtering and multi-selection for fast transaction management.

---

## 🎨 Design Philosophy
FinFlow uses a **Midnight Graphite** design system:
- **Typography**: Geometric "Outfit" font for a modern fintech feel.
- **Aesthetics**: Glassmorphism, subtle indigo ambient glows, and vibrant accent colors (Cyan, Emerald, Rose).
- **Responsiveness**: Fully optimized for mobile, tablet, and desktop viewing.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts.
- **Backend**: Node.js, Express.js, JWT Authentication.
- **Database**: Neon Postgres (Serverless PostgreSQL).
- **ORM**: Drizzle ORM.
- **Utilities**: Tesseract.js (OCR), PapaParse (CSV Processing).

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Neon Account](https://neon.tech/) for Postgres hosting.

### 2. Environment Setup
Create a `.env` file in the `server/` directory:
```env
PORT=5000
DATABASE_URL=postgresql://user:pass@ep-hostname.region.pooler.neon.tech/neondb?sslmode=require
JWT_SECRET=your_secret_key
CLIENT_ORIGIN=http://localhost:5173
```

Create a `.env` file in the `client/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Running Locally
From the root directory, you can use the monorepo scripts:
```bash
# Install everything
npm run install-all

# Start backend (separate terminal)
cd server && npm run dev

# Start frontend (separate terminal)
cd client && npm run dev
```

---

## ☁️ Deployment Guide (Render)

### 1. Backend Deployment
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. **Root Directory**: `server`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add your Environment Variables:
   - `DATABASE_URL`: Your Neon connection string.
   - `JWT_SECRET`: A secure random string.
   - `CLIENT_ORIGIN`: Your deployed frontend URL.

### 2. Frontend Deployment
1. Create a new **Static Site** on Render.
2. Connect your GitHub repository.
3. **Root Directory**: `client`
4. **Build Command**: `npm run build`
5. **Publish Directory**: `dist`
6. Add Environment Variable:
   - `VITE_API_BASE_URL`: Your deployed backend API URL (e.g., `https://finflow-api.onrender.com/api`).

---

## 📂 Project Structure

```text
├── client/          # Vite + React Frontend
│   ├── src/
│   │   ├── auth/    # Login/Register Logic
│   │   ├── db/      # (Internal) Shared Types
│   │   ├── layout/  # Navigation & Shell
│   │   └── pages/   # Feature specific views
├── server/          # Express API Backend
│   ├── src/
│   │   ├── db/      # Drizzle Schema & Client
│   │   ├── routes/  # SQL Standard Endpoints
│   │   └── middleware/# Auth & Protection
```

---

<p align="center">Made with ❤️ for financial freedom</p>
