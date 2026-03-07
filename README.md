# 🚗 Car Credit Hub - Backend API

Node.js + Express + PostgreSQL backend for loan management system.

## 🚀 Features

- ✅ JWT Authentication & Authorization
- 📊 RESTful API Design
- 🔐 Role-based Access Control (Admin, Manager, Sales, Accountant)
- 💰 Loan Management System
- 🏦 Bank & Broker Management
- 👥 User Management
- 📈 Dashboard Analytics
- 💼 Commission Tracking
- 📋 Lead Management
- 📊 Reports Generation

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **CORS**: cors

## 📦 Installation

```bash
npm install
```

## ⚙️ Configuration

Create `.env` file:

```env
PORT=5000
DATABASE_URL=postgres://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

## 🗄️ Database Setup

```bash
# Run migrations to create tables
npm run migrate

# Seed initial data (admin user, banks, brokers)
npm run seed
```

Default admin credentials:
- Email: `admin@carcredithub.com`
- Password: `admin123`

## 🏃 Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/profile` - Get user profile

### Loans
- `GET /api/loans` - Get all loans
- `GET /api/loans/:id` - Get loan by ID
- `POST /api/loans` - Create loan
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan

### Banks
- `GET /api/banks` - Get all banks
- `POST /api/banks` - Create bank
- `PUT /api/banks/:id` - Update bank
- `DELETE /api/banks/:id` - Delete bank

### Brokers
- `GET /api/brokers` - Get all brokers
- `POST /api/brokers` - Create broker
- `PUT /api/brokers/:id` - Update broker
- `DELETE /api/brokers/:id` - Delete broker

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Commissions
- `GET /api/commissions` - Get all commissions
- `POST /api/commissions` - Create commission
- `PUT /api/commissions/:id` - Update commission
- `DELETE /api/commissions/:id` - Delete commission

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Reports
- `GET /api/reports/loans` - Loan report
- `GET /api/reports/commissions` - Commission report
- `GET /api/reports/sales` - Sales report

## 🔐 User Roles

- **admin** - Full system access
- **manager** - Manage loans, banks, brokers
- **sales** - Create/view loans and leads
- **accountant** - Manage commissions and reports

## 🐳 Docker Deployment

```bash
docker build -t car-credit-backend .
docker run -p 5000:5000 --env-file .env car-credit-backend
```

## 👨💍 Author

**RoastCoder** (Yogendra Singh)
- GitHub: [@RoastCoder](https://github.com/RoastCoder)
- Founder @ StandaloneCoders

---

Built with ❤️ by RoastCoder
