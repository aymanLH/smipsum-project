# SMIPSUM Project Management Platform

A full-stack web application for managing construction project requests with real-time tracking and administration capabilities.

## 🎯 Overview

Interactive portal for centralized project request management, enabling clients to submit and track projects while providing administrators with comprehensive management tools.

## ✨ Features

### Client Portal
- Online project submission with form validation
- Real-time project status tracking
- Request history and documentation
- Responsive design for mobile and desktop

### Admin Dashboard
- Centralized request management interface
- Project status workflow management
- Client communication system
- Analytics and reporting tools

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design
- Client-side form validation
- Dynamic UI components

### Backend
- Node.js with Express.js
- RESTful API architecture
- JWT authentication
- Middleware for request handling

### Database
- Relational database design
- SQL queries and optimization
- Data integrity constraints

## 📦 Project Structure

```
smipsum-project/
├── public/
│   ├── css/                    # Stylesheets
│   ├── images/                 # Image assets
│   ├── js/                     # Client-side JavaScript
│   ├── admin-dashboard.html    # Admin interface
│   ├── dashboard.html          # User dashboard
│   ├── index.html              # Landing page
│   └── login.html              # Authentication page
├── node_modules/               # Dependencies
├── .env                        # Environment variables
├── package-lock.json           # Dependency lock file
├── package.json                # Project configuration
└── server.js                   # Express backend server
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14 or higher
- npm or yarn package manager
- Database system (PostgreSQL/MySQL/MongoDB)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/username/smipsum-project.git
cd smipsum-project

# Install dependencies
npm install
```

### Configuration

```bash
# Create environment variables file
cp .env.example .env

# Configure the following in .env:
# - DATABASE_URL
# - JWT_SECRET
# - PORT
# - SESSION_SECRET
```

### Running the Application

```bash
# Start the server
npm start

# For development with auto-reload
npm run dev
```

The application will be available at `http://localhost:3000` (or your configured PORT)

## 🔌 API Documentation

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Projects
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
PATCH  /api/projects/:id/status
```

### Users (Admin)
```
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

## 🗄️ Database Schema

### Main Tables
- `users` - User accounts and authentication
- `projects` - Project requests and details
- `project_status` - Status tracking and history
- `documents` - File attachments and metadata
- `comments` - Communication and notes

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## 🚢 Deployment

### Production Deployment

```bash
# Set environment to production
NODE_ENV=production

# Start server
npm start
```

### Environment Variables (Production)

```
NODE_ENV=production
DATABASE_URL=your_production_db_url
JWT_SECRET=your_secure_secret
PORT=3000
SESSION_SECRET=your_session_secret
```

## 📊 Features Roadmap

- [ ] Email notifications
- [ ] Document upload and management
- [ ] Advanced filtering and search
- [ ] Export to PDF/Excel
- [ ] Multi-language support
- [ ] Mobile application

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- SQL injection prevention
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Bug Reports

Please use the GitHub issue tracker to report bugs or request features.

## 📞 Support

For technical support, please open an issue in the repository.