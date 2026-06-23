ZIX RKTM Job Portal

A modern MERN Stack-based Job Portal platform that allows users to register, apply for active work opportunities, perform data entry tasks, and manage their earnings through an integrated payment system. The platform includes a powerful Admin Panel for managing job cards, users, tasks, payments, and overall platform activities.

🚀 Features
👤 User Features
User Registration & Login
Secure Authentication System
User Dashboard
Active Work Enrollment
Data Entry Work Module
Job Card Application System
Profile Management
Work Progress Tracking
Task Submission System
Transaction History
Responsive Mobile-Friendly Interface

💼 Job Management
Browse Available Job Cards
View Job Details
Apply for Jobs
Track Application Status
Active Work Assignment
Data Entry Task Allocation

💳 Payment Integration
Chinese Payment Gateway Integration
Secure Payment Processing
Payment Verification
Transaction Management
Deposit Tracking

📊 Admin Panel
Admin Authentication
Dashboard Analytics
Add/Edit/Delete Job Cards
User Management
Task Management
Work Approval System
Payment Monitoring
Transaction Reports
Activity Tracking
Website Settings Management
Platform Statistics

📈 Reporting & Monitoring
User Activity Reports
Job Application Reports
Payment Reports
Work Submission Reports
Admin Analytics Dashboard

🛠️ Technology Stack
Frontend
React.js
Vite
React Router DOM
Axios
Bootstrap / Tailwind CSS
Material UI (Optional)
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
bcrypt.js
Database
MongoDB Atlas
Payment Gateway
Chinese Payment Gateway API Integration


ZIX-RKTM/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── package.json
│
├── uploads/
├── .env
├── README.md
└── package.json

🔐 Authentication

The platform uses:

JWT Token Authentication
Password Encryption using bcrypt
Protected Routes
Role-Based Access Control
User
Admin


⚙️ Installation
Clone Repository
git clone https://github.com/yourusername/zix-rktm.git
cd zix-rktm
Install Dependencies

Frontend
cd client
npm install
Backend
cd server
npm install

Environment Variables

Create a .env file inside the server directory.

PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

PAYMENT_API_URL=your_gateway_url
PAYMENT_MERCHANT_ID=your_merchant_id
PAYMENT_SECRET_KEY=your_secret_key

▶️ Run Project

Start Backend
cd server
npm run dev

Start Frontend
cd client
npm run dev

👨‍💼 Admin Functions

Job Management

Create Job Cards
Edit Job Cards
Delete Job Cards
Activate/Deactivate Jobs

User Management

View Users
Manage User Accounts
Verify Users
Block/Unblock Users

Work Management

Assign Data Entry Tasks
Review Submitted Work
Approve or Reject Work
Monitor User Performance

Payment Management

View Deposits
Verify Transactions
Manage Payment Records

📱 Responsive Design

The platform is fully responsive and optimized for:

Desktop
Tablet
Mobile Devices

🔒 Security Features

JWT Authentication
Password Hashing
API Validation
Protected Routes
Role-Based Access Control
Secure Payment Requests



🎯 Use Cases
Online Data Entry Work Platform
Job Card Management System
Workforce Management
Task-Based Earning Platform
Admin-Controlled Work Distribution

