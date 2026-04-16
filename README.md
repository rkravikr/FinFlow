# 🌊 FinFlow

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
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
- **🤖 Smart Auto-Categorization**: Custom rules engine that maps descriptions like "Starbucks" to "Food & Dining" automatically.
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
- **Database**: MongoDB (via Mongoose).
- **Utilities**: Tesseract.js (OCR), PapaParse (CSV Processing).

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)

### 2. Backend Setup (`/server`)
1. **Navigate to server**:
   ```bash
   cd server
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Config**: Create a `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   CLIENT_ORIGIN=http://localhost:5173
   ```
4. **Start Server**:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup (`/client`)
1. **Navigate to client**:
   ```bash
   cd client
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Connect to API**: Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. **Launch Web App**:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```text
├── client/          # Vite + React Frontend
│   ├── src/
│   │   ├── auth/    # Login/Register Logic
│   │   ├── currency/# Multi-currency logic
│   │   ├── dashboard/# Recharts Analytics
│   │   ├── layout/  # Navigation & Shell
│   │   ├── pages/   # Feature specific views
│   │   └── style.css# Custom design tokens
├── server/          # Express API Backend
│   ├── src/
│   │   ├── models/  # Mongoose Schemas (User, Transaction, Goal, Sub)
│   │   ├── routes/  # API Endpoints
│   │   └── middleware/# Auth & Protection
```

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Made with ❤️ for financial freedom</p>
