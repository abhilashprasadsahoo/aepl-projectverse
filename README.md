# AEPL-PROJECTVERSE - Project Marketplace Platform

A full-stack project selling marketplace where users must log in to buy projects. After purchase, projects remain permanently in the buyer's account. Only Admin can create and manage project listings. Razorpay is used for secure payment processing.

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Project Catalog**: Browse projects with preview details (screenshots, demo videos, descriptions)
- **Secure Payments**: Razorpay integration with backend signature verification
- **User Dashboard**: Access purchased projects and download files anytime
- **Admin Panel**: Full CRUD operations for projects, users, and transactions
- **Reviews & Ratings**: Users can review purchased projects

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- Razorpay Payment Gateway
- Multer for file uploads

### Frontend
- React.js with Vite
- Tailwind CSS
- React Router DOM
- Axios for API calls

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Razorpay account (for payment processing)

## Installation

### 1. Clone the repository

### 2. Install Backend Dependencies
```
bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```
env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/aepl-projectverse
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
FRONTEND_URL=http://localhost:5173
```

### 4. Install Frontend Dependencies
```
bash
cd frontend
npm install
```

## Running the Application

### 1. Start MongoDB
Make sure MongoDB is running locally or use a cloud instance.

### 2. Start Backend Server
```
bash
cd backend
npm start
```
Server will run on http://localhost:5000

### 3. Start Frontend Development Server
```
bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

## Default Admin Account

After starting the server, you can create an admin account through the API:

```
bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin", "email": "admin@example.com", "password": "admin123"}'
```

Then manually update the user's role to 'admin' in MongoDB:
```
javascript
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects (Public)
- `GET /api/projects` - List all active projects
- `GET /api/projects/featured` - Get featured projects
- `GET /api/projects/:id` - Get project details

### Orders
- `POST /api/orders/create` - Create Razorpay order
- `POST /api/orders/verify` - Verify payment signature
- `GET /api/orders/my-orders` - Get user's purchased projects
- `GET /api/orders/:projectId/download` - Get download links

### Reviews
- `POST /api/reviews` - Add review (must have purchased)
- `GET /api/reviews/project/:projectId` - Get project reviews

### Admin Routes (Admin only)
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Manage users
- `POST /api/admin/projects` - Create project
- `PUT /api/admin/projects/:id` - Update project
- `DELETE /api/admin/projects/:id` - Delete project
- `POST /api/admin/projects/:id/files` - Upload project files
- `GET /api/admin/transactions` - View all transactions

## Project Structure

```
aepl-projectverse/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── uploads/         # File uploads
│   ├── .env            # Environment variables
│   ├── server.js       # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # Auth context
│   │   ├── services/   # API services
│   │   └── App.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── SPEC.md             # Project specification
└── README.md
```

## Security Features

- JWT-based authentication
- Role-based access control (Admin/Buyer)
- Backend payment signature verification
- Secure file downloads (only for verified purchases)
- Password hashing with bcrypt

## License

MIT
