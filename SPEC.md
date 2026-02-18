# AEPL-PROJECTVERSE - Project Marketplace Platform Specification

## 1. Project Overview
A full-stack project selling marketplace where users must log in to buy projects. After purchase, projects remain permanently in the buyer's account. Only Admin can create and manage project listings. Razorpay is used for secure payment processing.

## 2. Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Gateway**: Razorpay
- **File Storage**: Local storage with secure paths

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Context API

## 3. Database Schema

### Users Collection
```
javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['buyer', 'admin']),
  status: String (enum: ['active', 'blocked']),
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection
```
javascript
{
  _id: ObjectId,
  title: String,
  short_description: String,
  technology_stack: String,
  difficulty_level: String (enum: ['Beginner', 'Intermediate', 'Advanced']),
  price: Number,
  rating: Number (default: 0),
  status: String (enum: ['active', 'inactive']),
  is_featured: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Project_Previews Collection
```
javascript
{
  _id: ObjectId,
  project_id: ObjectId (ref: Projects),
  screenshot_url: String,
  demo_video_url: String
}
```

### Project_Files Collection
```
javascript
{
  _id: ObjectId,
  project_id: ObjectId (ref: Projects),
  source_code: String (file path),
  documentation: String (file path),
  project_report: String (file path),
  demo_video: String (file path),
  readme: String (file path)
}
```

### Orders Collection
```
javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: Users),
  project_id: ObjectId (ref: Projects),
  razorpay_order_id: String,
  payment_id: String,
  razorpay_signature: String,
  amount: Number,
  status: String (enum: ['pending', 'paid', 'failed', 'refunded']),
  purchase_date: Date
}
```

### Reviews Collection
```
javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: Users),
  project_id: ObjectId (ref: Projects),
  rating: Number (1-5),
  comment: String,
  createdAt: Date
}
```

## 4. API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects (Public)
- `GET /api/projects` - List all active projects (limited details for non-logged users)
- `GET /api/projects/:id` - Get project details (preview)
- `GET /api/projects/featured` - Get featured projects

### Projects (Admin Only)
- `POST /api/admin/projects` - Create new project
- `PUT /api/admin/projects/:id` - Update project
- `DELETE /api/admin/projects/:id` - Delete project
- `POST /api/admin/projects/:id/files` - Upload project files
- `PUT /api/admin/projects/:id/feature` - Feature/unfeature project

### Orders
- `POST /api/orders/create` - Create Razorpay order
- `POST /api/orders/verify` - Verify payment signature
- `GET /api/orders/my-orders` - Get user's purchased projects
- `GET /api/orders/:id/download` - Download project files (if purchased)

### Reviews
- `POST /api/reviews` - Add review
- `GET /api/reviews/project/:projectId` - Get project reviews
- `DELETE /api/admin/reviews/:id` - Delete review (admin)

### Users (Admin)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/block` - Block/unblock user
- `GET /api/admin/transactions` - View all transactions

## 5. Payment Flow

1. User clicks "Buy Now" on a project
2. Backend creates Razorpay order with project price
3. Frontend opens Razorpay checkout
4. User completes payment via UPI/Card/Netbanking
5. Razorpay returns order_id, payment_id, signature
6. Frontend sends payment details to backend
7. Backend verifies signature with secret key
8. If valid → Order marked as paid → Project unlocked for user
9. User can access files from dashboard anytime

## 6. Security Rules

- No public file paths - All files served through authenticated endpoints
- Download allowed only if paid order exists for the user
- Payment signature verification mandatory on backend
- Role-based access control (RBAC)
- Razorpay secret key stored in backend environment variables only
- Password hashing with bcrypt
- JWT tokens with expiration

## 7. Project Structure

```
aepl-projectverse/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 8. Pages & Components

### Frontend Pages
1. **Home** - Featured projects, categories
2. **Browse Projects** - Grid of all projects with filters
3. **Project Details** - Preview (locked content), buy button
4. **Login/Signup** - Authentication forms
5. **User Dashboard** - Purchased projects, download links
6. **Admin Dashboard** - Manage projects, users, orders
7. **Admin Project Form** - Create/Edit project

### Key Components
- Navbar (with auth state)
- ProjectCard (preview mode)
- ProjectCardFull (purchased mode with download)
- RazorpayPayment Modal
- FileDownloadButton
- RatingStars
- AdminSidebar
