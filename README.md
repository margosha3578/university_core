# University Core Management System

A comprehensive Django-based university management system that provides user management, course management, and scheduling functionality for educational institutions.

## 🚀 Features

- **User Management**: Custom user authentication with role-based access (Admin, Student, Professor)
- **Course Management**: Create and manage courses with lessons and multimedia content
- **Schedule Management**: Event scheduling with different types (meetings, lectures, exams, assignments)
- **JWT Authentication**: Secure token-based authentication
- **Docker Support**: Containerized deployment with Docker Compose
- **Media Handling**: Image uploads for user profiles, courses, and lessons
- **Responsive Design**: Modern frontend with static file serving

## 🛠️ Tech Stack

- **Backend**: Django 4.2.7
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with PyJWT
- **Media Storage**: Pillow for image handling
- **Deployment**: Docker, Gunicorn, WhiteNoise
- **Configuration**: python-decouple for environment variables

## 📋 Prerequisites

- Python 3.11+
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd university_core
   ```

2. **Start the application**
   ```bash
   # Development mode
   make dev-start
   
   # Production mode
   make prod-start
   ```

3. **Access the application**
   - Application: http://localhost:8000
   - Admin panel: http://localhost:8000/admin

### Manual Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd university_core
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment configuration**
   ```bash
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Run the server**
   ```bash
   python manage.py runserver
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database (Production)
DB_NAME=university_db
DB_USER=db_user
DB_PASSWORD=db_password
DB_HOST=localhost
DB_PORT=5432

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret-key
```

## 📁 Project Structure

```
university_core/
├── build/                    # Docker configuration
│   ├── docker-compose/      # Docker Compose files
│   └── dockerfile/          # Dockerfile
├── courses/                 # Course management app
│   ├── models.py           # Course and Lesson models
│   ├── views.py            # Course views
│   └── admin.py            # Admin interface
├── schedule/               # Schedule management app
│   ├── models.py          # Event model
│   ├── views.py           # Schedule views
│   └── admin.py           # Admin interface
├── users/                  # User management app
│   ├── models.py          # Custom User model
│   ├── views.py           # Authentication views
│   └── jwt_utils.py       # JWT utilities
├── static/                 # Static files
├── templates/              # HTML templates
├── media/                  # User uploaded files
├── scripts/                # Deployment scripts
├── university_core/        # Django project settings
└── requirements.txt        # Python dependencies
```

## 👥 User Roles & Permissions

The system implements role-based access control with three distinct user roles:

### 🎓 Students (Read-Only Access)
- **✅ View Users**: Can view all user information (list and details)
- **✅ View Courses**: Can view all courses and lessons (read-only)
- **✅ View Events**: Can view all events (read-only)
- **❌ Create/Update/Delete**: No modification permissions

### 👨‍🏫 Professors (Full Course/Lesson/Event Management + Read Users)
- **✅ View Users**: Can view all user information (list and details)
- **✅ Courses**: Full CRUD operations (create, read, update, delete)
- **✅ Lessons**: Full CRUD operations (create, read, update, delete)
- **✅ Events**: Full CRUD operations (create, read, update, delete)
- **❌ User Management**: Cannot create/update/delete users

### 👑 Admins (Full Access to Everything)
- **✅ Users**: Full CRUD operations (create, read, update, delete)
- **✅ Courses**: Full CRUD operations (create, read, update, delete)
- **✅ Lessons**: Full CRUD operations (create, read, update, delete)
- **✅ Events**: Full CRUD operations (create, read, update, delete)

### 📋 Permission Matrix

| Action | Student | Professor | Admin |
|--------|---------|-----------|-------|
| View Users | ✅ | ✅ | ✅ |
| View Courses | ✅ | ✅ | ✅ |
| View Events | ✅ | ✅ | ✅ |
| Create Courses | ❌ | ✅ | ✅ |
| Update Courses | ❌ | ✅ | ✅ |
| Delete Courses | ❌ | ✅ | ✅ |
| Create Lessons | ❌ | ✅ | ✅ |
| Update Lessons | ❌ | ✅ | ✅ |
| Delete Lessons | ❌ | ✅ | ✅ |
| Create Events | ❌ | ✅ | ✅ |
| Update Events | ❌ | ✅ | ✅ |
| Delete Events | ❌ | ✅ | ✅ |
| Create Users | ❌ | ❌ | ✅ |
| Update Users | ❌ | ❌ | ✅ |
| Delete Users | ❌ | ❌ | ✅ |

### 🔐 Security Implementation

- **JWT Authentication**: All API endpoints require valid JWT tokens
- **Role Validation**: Each endpoint checks user roles before allowing access
- **Comprehensive Logging**: All access attempts are logged with user role information
- **Error Handling**: Proper error responses for unauthorized access attempts
- **Permission Checks**: Server-side validation ensures clients cannot bypass restrictions

## 🗄️ Database Models

### User Model
- Custom user model with email authentication
- Role-based permissions (admin, student, professor)
- Profile information (name, phone, date of birth, picture)

### Course Model
- Course information (title, description, image)
- Created by professors
- Associated lessons

### Lesson Model
- Lesson content (title, description, full text)
- Ordered within courses
- Optional lesson images

### Event Model
- Schedule events (meetings, lectures, exams, assignments)
- Date/time management
- Priority levels and event types

## 🐳 Docker Commands

The project includes a comprehensive Makefile for Docker operations:

```bash
# Development
make dev-start    # Build and start in development mode
make dev-up       # Start development containers
make dev-down     # Stop development containers

# Production
make prod-start   # Build and start in production mode
make up           # Start production containers
make down         # Stop containers

# Utilities
make logs         # View container logs
make connect      # Connect to running container
make restart      # Restart containers
```

## 🗄️ Database Population

The project includes a database population script to quickly set up test data for development and testing purposes.

### Populate Database with Test Data

```bash
# Using Docker (recommended)
make populate-db

# Or manually in Docker container
docker compose exec web python scripts/populate_db.py

# For local development (without Docker)
python scripts/populate_db.py
```

### Test Data Created

The population script creates comprehensive test data:

#### **👥 Users (12 total)**
- **2 Admin users**: Full system access
- **5 Professor users**: Course and event management
- **5 Student users**: Read-only access

#### **📚 Courses (7 total)**
- **7 courses** with detailed descriptions
- **25 lessons** (5 lessons per course)
- **Active/inactive status** for testing

#### **📅 Events (25 total)**
- **5 meetings**: Staff and department meetings
- **5 lectures**: Course lectures and seminars
- **5 exams**: Midterm and final examinations
- **5 assignments**: Project deadlines and submissions
- **5 other events**: Various university activities

### Test Credentials

After running the population script, you can use these test accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | `admin@university.edu` | `admin123` | Full system access |
| Professor | `prof.smith@university.edu` | `prof123` | Course & event management |
| Student | `student1@university.edu` | `student123` | Read-only access |

### Features of Population Script

- **Safe execution**: Uses `get_or_create()` to avoid duplicates
- **Realistic data**: Creates meaningful test content
- **Comprehensive coverage**: All models populated with related data
- **Development ready**: Perfect for testing all system features
- **Docker compatible**: Works seamlessly with containerized setup

### Usage Notes

- **Run after migration**: Execute after `python manage.py migrate`
- **Safe to re-run**: Script won't create duplicates
- **Development only**: Not intended for production use
- **Test all features**: Provides data to test all system functionality

## 🔐 Security Features

- JWT token-based authentication
- CSRF protection
- Secure cookie settings 
- XSS protection
- Content type sniffing protection
- SSL redirect 

## 📊 API Endpoints

The system provides RESTful API endpoints for:

- User authentication and management
- Course management
- Lesson management
- Schedule/event management

---

**Note**: This is a pet project created during education and is **not built for production use**. While it demonstrates Django concepts and university management system functionality, it lacks production-ready security measures, comprehensive testing, and enterprise-level features. Use this project for learning purposes only.
