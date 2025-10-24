#!/usr/bin/env python
"""
Database Population Script for University Core
This script populates the database with test data for all models.
"""

import os
import sys
import django
from datetime import datetime, date, time, timedelta
from django.utils import timezone

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'university_core.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import Course, Lesson
from schedule.models import Event

User = get_user_model()


def create_users():
    """Create test users with different roles"""
    print("Creating users...")
    
    users_data = [
        # Admin users
        {
            'email': 'admin@university.edu',
            'password': 'admin123',
            'first_name': 'John',
            'last_name': 'Admin',
            'father_name': 'Michael',
            'user_role': 'admin',
            'phone_number': '+1234567890',
            'date_of_birth': date(1980, 5, 15),
            'is_staff': True,
            'is_superuser': True,
        },
        {
            'email': 'admin2@university.edu',
            'password': 'admin123',
            'first_name': 'Sarah',
            'last_name': 'Administrator',
            'father_name': 'Robert',
            'user_role': 'admin',
            'phone_number': '+1234567891',
            'date_of_birth': date(1982, 8, 22),
            'is_staff': True,
            'is_superuser': True,
        },
        
        # Professor users
        {
            'email': 'prof.smith@university.edu',
            'password': 'prof123',
            'first_name': 'Dr. Michael',
            'last_name': 'Smith',
            'father_name': 'David',
            'user_role': 'professor',
            'phone_number': '+1234567892',
            'date_of_birth': date(1975, 3, 10),
        },
        {
            'email': 'prof.johnson@university.edu',
            'password': 'prof123',
            'first_name': 'Dr. Emily',
            'last_name': 'Johnson',
            'father_name': 'James',
            'user_role': 'professor',
            'phone_number': '+1234567893',
            'date_of_birth': date(1978, 7, 18),
        },
        {
            'email': 'prof.brown@university.edu',
            'password': 'prof123',
            'first_name': 'Dr. Robert',
            'last_name': 'Brown',
            'father_name': 'William',
            'user_role': 'professor',
            'phone_number': '+1234567894',
            'date_of_birth': date(1973, 11, 5),
        },
        {
            'email': 'prof.davis@university.edu',
            'password': 'prof123',
            'first_name': 'Dr. Lisa',
            'last_name': 'Davis',
            'father_name': 'Thomas',
            'user_role': 'professor',
            'phone_number': '+1234567895',
            'date_of_birth': date(1976, 1, 30),
        },
        {
            'email': 'prof.wilson@university.edu',
            'password': 'prof123',
            'first_name': 'Dr. James',
            'last_name': 'Wilson',
            'father_name': 'Charles',
            'user_role': 'professor',
            'phone_number': '+1234567896',
            'date_of_birth': date(1974, 9, 12),
        },
        
        # Student users
        {
            'email': 'student1@university.edu',
            'password': 'student123',
            'first_name': 'Alice',
            'last_name': 'Johnson',
            'father_name': 'John',
            'user_role': 'student',
            'phone_number': '+1234567897',
            'date_of_birth': date(2000, 4, 20),
        },
        {
            'email': 'student2@university.edu',
            'password': 'student123',
            'first_name': 'Bob',
            'last_name': 'Williams',
            'father_name': 'Mark',
            'user_role': 'student',
            'phone_number': '+1234567898',
            'date_of_birth': date(2001, 6, 15),
        },
        {
            'email': 'student3@university.edu',
            'password': 'student123',
            'first_name': 'Carol',
            'last_name': 'Miller',
            'father_name': 'Paul',
            'user_role': 'student',
            'phone_number': '+1234567899',
            'date_of_birth': date(1999, 12, 8),
        },
        {
            'email': 'student4@university.edu',
            'password': 'student123',
            'first_name': 'David',
            'last_name': 'Garcia',
            'father_name': 'Carlos',
            'user_role': 'student',
            'phone_number': '+1234567800',
            'date_of_birth': date(2002, 2, 14),
        },
        {
            'email': 'student5@university.edu',
            'password': 'student123',
            'first_name': 'Eva',
            'last_name': 'Martinez',
            'father_name': 'Jose',
            'user_role': 'student',
            'phone_number': '+1234567801',
            'date_of_birth': date(2000, 10, 25),
        },
    ]
    
    created_users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults=user_data
        )
        if created:
            created_users.append(user)
            print(f"  ✓ Created user: {user.full_name} ({user.email})")
        else:
            print(f"  - User already exists: {user.full_name} ({user.email})")
    
    return created_users


def create_courses():
    """Create test courses"""
    print("\nCreating courses...")
    
    # Get professors to assign as course creators
    professors = User.objects.filter(user_role='professor')
    if not professors.exists():
        print("  ⚠ No professors found. Please create users first.")
        return []
    
    courses_data = [
        {
            'title': 'Introduction to Computer Science',
            'description': 'A comprehensive introduction to computer science fundamentals including programming concepts, data structures, algorithms, and software engineering principles. This course covers basic programming languages, problem-solving techniques, and computational thinking.',
            'created_by': professors[0],
            'is_active': True,
        },
        {
            'title': 'Advanced Mathematics',
            'description': 'Advanced mathematical concepts including calculus, linear algebra, differential equations, and mathematical analysis. Students will learn to apply mathematical principles to solve complex problems in various fields.',
            'created_by': professors[1],
            'is_active': True,
        },
        {
            'title': 'Database Systems',
            'description': 'Comprehensive study of database design, implementation, and management. Topics include relational database theory, SQL programming, database optimization, and modern database technologies.',
            'created_by': professors[2],
            'is_active': True,
        },
        {
            'title': 'Web Development',
            'description': 'Modern web development using HTML, CSS, JavaScript, and popular frameworks. Students will learn frontend and backend development, responsive design, and web application deployment.',
            'created_by': professors[3],
            'is_active': True,
        },
        {
            'title': 'Machine Learning',
            'description': 'Introduction to machine learning algorithms, data preprocessing, model training, and evaluation. Covers supervised and unsupervised learning, neural networks, and practical applications.',
            'created_by': professors[4],
            'is_active': True,
        },
        {
            'title': 'Software Engineering',
            'description': 'Software development lifecycle, design patterns, testing methodologies, and project management. Students will work on real-world projects using industry-standard tools and practices.',
            'created_by': professors[0],
            'is_active': True,
        },
        {
            'title': 'Data Structures and Algorithms',
            'description': 'In-depth study of fundamental data structures and algorithms. Topics include arrays, linked lists, trees, graphs, sorting algorithms, and complexity analysis.',
            'created_by': professors[1],
            'is_active': True,
        },
    ]
    
    created_courses = []
    for course_data in courses_data:
        course, created = Course.objects.get_or_create(
            title=course_data['title'],
            defaults=course_data
        )
        if created:
            created_courses.append(course)
            print(f"  ✓ Created course: {course.title}")
        else:
            print(f"  - Course already exists: {course.title}")
    
    return created_courses


def create_lessons():
    """Create test lessons for courses"""
    print("\nCreating lessons...")
    
    courses = Course.objects.all()
    if not courses.exists():
        print("  ⚠ No courses found. Please create courses first.")
        return []
    
    lessons_data = [
        # Introduction to Computer Science lessons
        {
            'course': courses[0],
            'title': 'Programming Fundamentals',
            'short_description': 'Introduction to programming concepts and basic syntax',
            'full_text': 'This lesson covers the fundamental concepts of programming including variables, data types, control structures, and basic algorithms. Students will learn how to write simple programs and understand the basic building blocks of software development.',
            'order': 1,
        },
        {
            'course': courses[0],
            'title': 'Object-Oriented Programming',
            'short_description': 'Understanding classes, objects, and inheritance',
            'full_text': 'This lesson introduces object-oriented programming concepts including classes, objects, inheritance, polymorphism, and encapsulation. Students will learn how to design and implement object-oriented solutions to programming problems.',
            'order': 2,
        },
        {
            'course': courses[0],
            'title': 'Data Structures Basics',
            'short_description': 'Introduction to arrays, lists, and basic data structures',
            'full_text': 'This lesson covers fundamental data structures including arrays, linked lists, stacks, and queues. Students will learn when and how to use each data structure effectively in their programs.',
            'order': 3,
        },
        {
            'course': courses[0],
            'title': 'Algorithm Design',
            'short_description': 'Problem-solving strategies and algorithm design techniques',
            'full_text': 'This lesson focuses on algorithm design principles including divide and conquer, dynamic programming, and greedy algorithms. Students will learn systematic approaches to solving computational problems.',
            'order': 4,
        },
        {
            'course': courses[0],
            'title': 'Software Testing',
            'short_description': 'Introduction to testing methodologies and quality assurance',
            'full_text': 'This lesson covers software testing fundamentals including unit testing, integration testing, and test-driven development. Students will learn how to write effective tests and ensure software quality.',
            'order': 5,
        },
        
        # Advanced Mathematics lessons
        {
            'course': courses[1],
            'title': 'Calculus Fundamentals',
            'short_description': 'Introduction to differential and integral calculus',
            'full_text': 'This lesson covers the fundamental concepts of calculus including limits, derivatives, and integrals. Students will learn how to apply calculus to solve problems in various fields.',
            'order': 1,
        },
        {
            'course': courses[1],
            'title': 'Linear Algebra',
            'short_description': 'Vector spaces, matrices, and linear transformations',
            'full_text': 'This lesson introduces linear algebra concepts including vector spaces, matrices, determinants, and eigenvalues. Students will learn how to solve systems of linear equations and understand linear transformations.',
            'order': 2,
        },
        {
            'course': courses[1],
            'title': 'Differential Equations',
            'short_description': 'Solving ordinary and partial differential equations',
            'full_text': 'This lesson covers differential equations including first-order and second-order equations, systems of differential equations, and applications in physics and engineering.',
            'order': 3,
        },
        {
            'course': courses[1],
            'title': 'Mathematical Analysis',
            'short_description': 'Rigorous study of mathematical concepts and proofs',
            'full_text': 'This lesson provides a rigorous introduction to mathematical analysis including sequences, series, continuity, and differentiability. Students will learn formal mathematical reasoning and proof techniques.',
            'order': 4,
        },
        {
            'course': courses[1],
            'title': 'Complex Analysis',
            'short_description': 'Functions of complex variables and complex integration',
            'full_text': 'This lesson introduces complex analysis including complex functions, analytic functions, Cauchy\'s theorem, and residue theory. Students will learn applications in engineering and physics.',
            'order': 5,
        },
        
        # Database Systems lessons
        {
            'course': courses[2],
            'title': 'Database Design',
            'short_description': 'Entity-relationship modeling and database normalization',
            'full_text': 'This lesson covers database design principles including entity-relationship modeling, normalization, and database schema design. Students will learn how to design efficient and normalized databases.',
            'order': 1,
        },
        {
            'course': courses[2],
            'title': 'SQL Programming',
            'short_description': 'Structured Query Language for database operations',
            'full_text': 'This lesson introduces SQL programming including SELECT, INSERT, UPDATE, DELETE operations, joins, subqueries, and advanced SQL features. Students will learn to write efficient database queries.',
            'order': 2,
        },
        {
            'course': courses[2],
            'title': 'Database Administration',
            'short_description': 'Database management, security, and performance tuning',
            'full_text': 'This lesson covers database administration tasks including user management, security, backup and recovery, and performance optimization. Students will learn how to maintain production databases.',
            'order': 3,
        },
        {
            'course': courses[2],
            'title': 'NoSQL Databases',
            'short_description': 'Introduction to non-relational database systems',
            'full_text': 'This lesson introduces NoSQL databases including document stores, key-value stores, and graph databases. Students will learn when and how to use different types of NoSQL databases.',
            'order': 4,
        },
        {
            'course': courses[2],
            'title': 'Database Security',
            'short_description': 'Security principles and best practices for databases',
            'full_text': 'This lesson covers database security including authentication, authorization, encryption, and security auditing. Students will learn how to protect databases from various security threats.',
            'order': 5,
        },
        
        # Web Development lessons
        {
            'course': courses[3],
            'title': 'HTML and CSS Fundamentals',
            'short_description': 'Building web pages with HTML and styling with CSS',
            'full_text': 'This lesson covers HTML structure, semantic markup, CSS styling, responsive design, and modern web standards. Students will learn to create attractive and functional web pages.',
            'order': 1,
        },
        {
            'course': courses[3],
            'title': 'JavaScript Programming',
            'short_description': 'Client-side programming with JavaScript',
            'full_text': 'This lesson introduces JavaScript programming including DOM manipulation, event handling, AJAX, and modern JavaScript features. Students will learn to create interactive web applications.',
            'order': 2,
        },
        {
            'course': courses[3],
            'title': 'Frontend Frameworks',
            'short_description': 'Modern frontend frameworks like React and Vue.js',
            'full_text': 'This lesson covers modern frontend frameworks including React, Vue.js, and Angular. Students will learn component-based development and state management.',
            'order': 3,
        },
        {
            'course': courses[3],
            'title': 'Backend Development',
            'short_description': 'Server-side programming and API development',
            'full_text': 'This lesson covers backend development including server-side programming, RESTful APIs, database integration, and authentication. Students will learn to build robust web services.',
            'order': 4,
        },
        {
            'course': courses[3],
            'title': 'Web Deployment',
            'short_description': 'Deploying web applications to production',
            'full_text': 'This lesson covers web deployment including hosting options, CI/CD pipelines, performance optimization, and monitoring. Students will learn to deploy and maintain production web applications.',
            'order': 5,
        },
        
        # Machine Learning lessons
        {
            'course': courses[4],
            'title': 'Introduction to Machine Learning',
            'short_description': 'Basic concepts and types of machine learning',
            'full_text': 'This lesson introduces machine learning concepts including supervised, unsupervised, and reinforcement learning. Students will learn about different types of ML algorithms and their applications.',
            'order': 1,
        },
        {
            'course': courses[4],
            'title': 'Data Preprocessing',
            'short_description': 'Cleaning and preparing data for machine learning',
            'full_text': 'This lesson covers data preprocessing techniques including data cleaning, feature engineering, normalization, and handling missing values. Students will learn to prepare data for ML algorithms.',
            'order': 2,
        },
        {
            'course': courses[4],
            'title': 'Supervised Learning',
            'short_description': 'Classification and regression algorithms',
            'full_text': 'This lesson covers supervised learning algorithms including linear regression, logistic regression, decision trees, and support vector machines. Students will learn to implement and evaluate these algorithms.',
            'order': 3,
        },
        {
            'course': courses[4],
            'title': 'Neural Networks',
            'short_description': 'Introduction to artificial neural networks',
            'full_text': 'This lesson introduces neural networks including perceptrons, multi-layer perceptrons, backpropagation, and deep learning. Students will learn to build and train neural networks.',
            'order': 4,
        },
        {
            'course': courses[4],
            'title': 'Model Evaluation',
            'short_description': 'Evaluating and improving machine learning models',
            'full_text': 'This lesson covers model evaluation techniques including cross-validation, metrics, overfitting, and model selection. Students will learn to assess and improve ML model performance.',
            'order': 5,
        },
    ]
    
    created_lessons = []
    for lesson_data in lessons_data:
        lesson, created = Lesson.objects.get_or_create(
            course=lesson_data['course'],
            title=lesson_data['title'],
            defaults=lesson_data
        )
        if created:
            created_lessons.append(lesson)
            print(f"  ✓ Created lesson: {lesson.title}")
        else:
            print(f"  - Lesson already exists: {lesson.title}")
    
    return created_lessons


def create_events():
    """Create test events for the schedule"""
    print("\nCreating events...")
    
    users = User.objects.all()
    if not users.exists():
        print("  ⚠ No users found. Please create users first.")
        return []
    
    # Get some professors and students for events
    professors = User.objects.filter(user_role='professor')[:3]
    students = User.objects.filter(user_role='student')[:3]
    
    # Create events for the next 30 days
    today = timezone.now().date()
    events_data = []
    
    # Meeting events
    for i in range(5):
        event_date = today + timedelta(days=i*3)
        events_data.append({
            'title': f'Faculty Meeting {i+1}',
            'description': f'Monthly faculty meeting to discuss academic matters and curriculum updates.',
            'creator': professors[0] if professors else users[0],
            'assigned_date': event_date,
            'start_time': time(14, 0),  # 2:00 PM
            'end_time': time(16, 0),    # 4:00 PM
            'event_type': 'meeting',
            'priority': 'medium',
            'location': 'Conference Room A',
            'is_all_day': False,
            'is_recurring': False,
        })
    
    # Lecture events
    for i in range(5):
        event_date = today + timedelta(days=i*2+1)
        events_data.append({
            'title': f'Advanced Mathematics Lecture {i+1}',
            'description': f'Lecture on advanced mathematical concepts and problem-solving techniques.',
            'creator': professors[1] if len(professors) > 1 else users[0],
            'assigned_date': event_date,
            'start_time': time(10, 0),  # 10:00 AM
            'end_time': time(12, 0),     # 12:00 PM
            'event_type': 'lecture',
            'priority': 'high',
            'location': 'Lecture Hall B',
            'is_all_day': False,
            'is_recurring': True,
        })
    
    # Exam events
    for i in range(5):
        event_date = today + timedelta(days=i*7)
        events_data.append({
            'title': f'Midterm Exam - Course {i+1}',
            'description': f'Midterm examination covering chapters 1-5 of the course material.',
            'creator': professors[i % len(professors)] if professors else users[0],
            'assigned_date': event_date,
            'start_time': time(9, 0),   # 9:00 AM
            'end_time': time(11, 0),    # 11:00 AM
            'event_type': 'exam',
            'priority': 'urgent',
            'location': 'Exam Hall C',
            'is_all_day': False,
            'is_recurring': False,
        })
    
    # Assignment events
    for i in range(5):
        event_date = today + timedelta(days=i*4+2)
        events_data.append({
            'title': f'Assignment Due - Project {i+1}',
            'description': f'Final submission deadline for the semester project assignment.',
            'creator': professors[i % len(professors)] if professors else users[0],
            'assigned_date': event_date,
            'start_time': time(23, 59),  # 11:59 PM
            'end_time': None,
            'event_type': 'deadline',
            'priority': 'high',
            'location': 'Online Submission',
            'is_all_day': False,
            'is_recurring': False,
        })
    
    # Other events
    for i in range(5):
        event_date = today + timedelta(days=i*5+3)
        events_data.append({
            'title': f'Student Workshop {i+1}',
            'description': f'Interactive workshop on practical skills and career development.',
            'creator': students[i % len(students)] if students else users[0],
            'assigned_date': event_date,
            'start_time': time(15, 0),  # 3:00 PM
            'end_time': time(17, 0),   # 5:00 PM
            'event_type': 'other',
            'priority': 'low',
            'location': 'Student Center',
            'is_all_day': False,
            'is_recurring': False,
        })
    
    created_events = []
    for event_data in events_data:
        event, created = Event.objects.get_or_create(
            title=event_data['title'],
            assigned_date=event_data['assigned_date'],
            defaults=event_data
        )
        if created:
            created_events.append(event)
            print(f"  ✓ Created event: {event.title} on {event.assigned_date}")
        else:
            print(f"  - Event already exists: {event.title} on {event.assigned_date}")
    
    return created_events


def main():
    """Main function to populate the database"""
    print("=" * 60)
    print("UNIVERSITY CORE DATABASE POPULATION SCRIPT")
    print("=" * 60)
    
    try:
        # Create users first (required for other models)
        users = create_users()
        
        # Create courses (requires professors)
        courses = create_courses()
        
        # Create lessons (requires courses)
        lessons = create_lessons()
        
        # Create events (requires users)
        events = create_events()
        
        # Summary
        print("\n" + "=" * 60)
        print("POPULATION SUMMARY")
        print("=" * 60)
        print(f"Users created: {len(users)}")
        print(f"Courses created: {len(courses)}")
        print(f"Lessons created: {len(lessons)}")
        print(f"Events created: {len(events)}")
        
        print(f"\nTotal records in database:")
        print(f"  Users: {User.objects.count()}")
        print(f"  Courses: {Course.objects.count()}")
        print(f"  Lessons: {Lesson.objects.count()}")
        print(f"  Events: {Event.objects.count()}")
        
        print("\n✓ Database population completed successfully!")
        print("\nTest accounts created:")
        print("  Admin: admin@university.edu / admin123")
        print("  Professor: prof.smith@university.edu / prof123")
        print("  Student: student1@university.edu / student123")
        
    except Exception as e:
        print(f"\n❌ Error during database population: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
