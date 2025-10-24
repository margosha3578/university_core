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

## 👥 User Roles

The system supports three user roles:

- **Admin**: Full system access, can manage users, courses, and schedules
- **Professor**: Can create and manage courses and schedules
- **Student**: Can view courses and schedules, limited access

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

## 🔐 Security Features

- JWT token-based authentication
- CSRF protection
- Secure cookie settings (production)
- XSS protection
- Content type sniffing protection
- SSL redirect (production)

## 📊 API Endpoints

The system provides RESTful API endpoints for:

- User authentication and management
- Course CRUD operations
- Lesson management
- Schedule/event management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

---

**Note**: This is a university management system designed for educational institutions. Ensure proper security measures are in place before deploying to production.
