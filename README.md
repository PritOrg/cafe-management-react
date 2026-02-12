# Cafe Management System

A comprehensive full-stack cafe management system built with React.js frontend and Node.js/Express backend with MongoDB database. This system provides complete functionality for managing cafe operations including menu management, order processing, staff administration, and customer management.

## 🚀 Features

### Frontend (React.js)
- **Modern UI/UX**: Built with Material-UI components and responsive design
- **Customer Interface**: 
  - Browse menu with categories and search functionality
  - Add items to cart with customization options
  - Real-time cart management with quantity adjustments
  - Secure user authentication and registration
- **Admin Dashboard**: 
  - Real-time analytics and statistics
  - Order management with status tracking
  - Menu item CRUD operations with image upload
  - Staff management and role-based access
  - Revenue tracking and reporting

### Backend (Node.js/Express)
- **RESTful API**: Industry-standard API design with proper HTTP methods
- **Authentication**: JWT-based authentication with role-based authorization
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer integration for menu item images
- **API Documentation**: Swagger/OpenAPI documentation

## 📁 Project Structure

```
cafe-management-system/
├── cafe-management-sys/          # React Frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin dashboard pages
│   │   │   ├── customer/        # Customer-facing pages
│   │   │   └── auth/            # Authentication pages
│   │   ├── services/            # API service layer
│   │   ├── context/             # React Context providers
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils/               # Utility functions
│   └── public/                  # Static assets
├── server/                      # Node.js Backend
│   ├── routes/                  # API route definitions
│   ├── models/                  # MongoDB/Mongoose models
│   ├── middleware/              # Express middleware
│   ├── controllers/             # Route controllers
│   └── config/                  # Configuration files
└── README.md                    # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cafe-management
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

5. Start the server:
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd cafe-management-sys
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment variables file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_APP_NAME=Cafe Management System
   ```

5. Start the development server:
   ```bash
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/docs

## 🔐 Authentication & Authorization

### User Roles
- **Customer**: Can browse menu, place orders, manage profile
- **Staff**: Can view and update order status, manage assigned tasks
- **Admin**: Full system access including staff management, analytics, and system configuration

### API Authentication
All protected routes require JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Menu Management
- `GET /api/menu` - Get all menu items (public)
- `POST /api/menu` - Create menu item (admin only)
- `PUT /api/menu/:id` - Update menu item (admin only)
- `DELETE /api/menu/:id` - Delete menu item (admin only)

### Order Management
- `GET /api/orders` - Get orders (staff/admin)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (staff/admin)
- `GET /api/orders/today` - Get today's orders (staff/admin)

### Staff Management (Admin Only)
- `GET /api/staff-admin` - Get all staff
- `POST /api/staff-admin` - Add new staff member
- `PUT /api/staff-admin/:id` - Update staff member
- `DELETE /api/staff-admin/:id` - Remove staff member

### Customer Management (Admin Only)
- `GET /api/customers` - Get all customers
- `PUT /api/customers/:id` - Update customer information

## 🎨 Frontend Architecture

### State Management
- **React Context**: Global state management for authentication and cart
- **Local State**: Component-level state with React hooks
- **API State**: Real-time data fetching with error handling

### Routing
- **React Router**: Client-side routing with protected routes
- **Nested Routes**: Admin dashboard with nested page routing
- **Route Guards**: Authentication and role-based route protection

### UI Components
- **Material-UI**: Consistent design system and components
- **Responsive Design**: Mobile-first approach with breakpoint management
- **Theme System**: Customizable theme with dark/light mode support

## 🔧 Development

### Code Standards
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks

### Testing
```bash
# Frontend tests
cd cafe-management-sys
npm test

# Backend tests
cd server
npm test
```

### Building for Production
```bash
# Build frontend
cd cafe-management-sys
npm run build

# The build files will be in the 'build' directory
```

## 🚀 Deployment

### Environment Configuration
Ensure all environment variables are properly configured for production:
- Database connection strings
- JWT secrets
- API URLs
- File upload paths

### Production Considerations
- Enable HTTPS
- Configure proper CORS settings
- Set up database backups
- Configure logging and monitoring
- Set up reverse proxy (nginx recommended)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at `/api/docs`
- Review the code comments and documentation

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
- **v1.1.0**: Added real-time order tracking
- **v1.2.0**: Enhanced admin dashboard with analytics
- **v1.3.0**: Improved authentication and security features

---

Built with ❤️ for efficient cafe management
