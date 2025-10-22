import json
import logging
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator

from .models import Course, Lesson
from users.jwt_utils import jwt_required

# Get logger for this module
logger = logging.getLogger(__name__)


@jwt_required
def api_courses_list(request):
    """API endpoint to list courses"""
    logger.info(f"Courses list accessed by: {request.user.email} (Role: {request.user.user_role})")
    courses = Course.objects.all().order_by('-created_at')
    
    # Filter by active status if specified
    is_active = request.GET.get('is_active')
    if is_active is not None:
        courses = courses.filter(is_active=is_active.lower() == 'true')
    
    # If user is not admin or professor, only show active courses
    if request.user.user_role not in ['admin', 'professor']:
        courses = courses.filter(is_active=True)
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(courses, 20)
    courses_page = paginator.get_page(page)
    
    logger.debug(f"Returning {len(courses_page)} courses (page {page}) to {request.user.email}")
    
    courses_data = []
    for course in courses_page:
        courses_data.append({
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'created_by': course.created_by.id,
            'created_by_name': course.created_by_name,
            'lessons_count': course.lessons_count,
            'is_active': course.is_active,
            'image_url': course.image.url if course.image else None,
            'created_at': course.created_at.isoformat(),
            'updated_at': course.updated_at.isoformat(),
        })
    
    return JsonResponse({
        'success': True,
        'courses': courses_data,
        'pagination': {
            'current_page': courses_page.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': courses_page.has_next(),
            'has_previous': courses_page.has_previous(),
        }
    })


@jwt_required
def api_course_detail(request, course_id):
    """API endpoint to get course details"""
    logger.info(f"Course detail accessed: Course ID {course_id} by {request.user.email}")
    course = get_object_or_404(Course, id=course_id)
    
    # If user is not admin or professor, only show active courses
    if request.user.user_role not in ['admin', 'professor'] and not course.is_active:
        logger.warning(f"Unauthorized access to inactive course: Course ID {course_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Course not found'
        }, status=404)
    
    # Get lessons for this course
    lessons = course.lessons.all().order_by('order')
    lessons_data = []
    for lesson in lessons:
        lessons_data.append({
            'id': lesson.id,
            'title': lesson.title,
            'short_description': lesson.short_description,
            'full_text': lesson.full_text,
            'order': lesson.order,
            'image_url': lesson.image.url if lesson.image else None,
            'created_at': lesson.created_at.isoformat(),
            'updated_at': lesson.updated_at.isoformat(),
        })
    
    course_data = {
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'created_by': course.created_by.id,
        'created_by_name': course.created_by_name,
        'lessons_count': course.lessons_count,
        'lessons': lessons_data,
        'is_active': course.is_active,
        'image_url': course.image.url if course.image else None,
        'created_at': course.created_at.isoformat(),
        'updated_at': course.updated_at.isoformat(),
    }
    
    return JsonResponse({
        'success': True,
        'course': course_data
    })


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def api_create_course(request):
    """API endpoint to create a new course"""
    logger.info(f"Course creation attempt by: {request.user.email}")
    # Only admin and professor can create courses
    if request.user.user_role not in ['admin', 'professor']:
        logger.warning(f"Unauthorized course creation attempt by: {request.user.email}")
        return JsonResponse({
            'error': 'Only admin and professor users can create courses'
        }, status=403)
    
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        if not data.get('title'):
            logger.warning(f"Course creation failed: Missing title by {request.user.email}")
            return JsonResponse({
                'error': 'Title is required'
            }, status=400)
        
        if not data.get('description'):
            logger.warning(f"Course creation failed: Missing description by {request.user.email}")
            return JsonResponse({
                'error': 'Description is required'
            }, status=400)
        
        # Create course
        course = Course.objects.create(
            title=data['title'],
            description=data['description'],
            created_by=request.user,
            is_active=data.get('is_active', True)
        )
        
        logger.info(f"Course created successfully: '{course.title}' (ID: {course.id}) by {request.user.email}")
        
        course_data = {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'created_by': course.created_by.id,
            'created_by_name': course.created_by_name,
            'lessons_count': course.lessons_count,
            'is_active': course.is_active,
            'image_url': course.image.url if course.image else None,
            'created_at': course.created_at.isoformat(),
            'updated_at': course.updated_at.isoformat(),
        }
        
        return JsonResponse({
            'success': True,
            'message': 'Course created successfully',
            'course': course_data
        }, status=201)
        
    except json.JSONDecodeError:
        logger.error(f"Course creation failed: Invalid JSON data by {request.user.email}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Course creation error by {request.user.email}: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e)
        }, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["PUT"])
def api_update_course(request, course_id):
    """API endpoint to update course"""
    logger.info(f"Course update attempt: Course ID {course_id} by {request.user.email}")
    course = get_object_or_404(Course, id=course_id)
    
    # Only course owner or admin can update
    if request.user.user_role != 'admin' and course.created_by != request.user:
        logger.warning(f"Unauthorized course update attempt: Course ID {course_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Permission denied'
        }, status=403)
    
    try:
        data = json.loads(request.body)
        
        # Update course fields
        if 'title' in data:
            course.title = data['title']
        if 'description' in data:
            course.description = data['description']
        if 'is_active' in data:
            course.is_active = data['is_active']
        
        course.save()
        
        logger.info(f"Course updated successfully: '{course.title}' (ID: {course.id}) by {request.user.email}")
        
        course_data = {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'created_by': course.created_by.id,
            'created_by_name': course.created_by_name,
            'lessons_count': course.lessons_count,
            'is_active': course.is_active,
            'image_url': course.image.url if course.image else None,
            'created_at': course.created_at.isoformat(),
            'updated_at': course.updated_at.isoformat(),
        }
        
        return JsonResponse({
            'success': True,
            'message': 'Course updated successfully',
            'course': course_data
        })
        
    except json.JSONDecodeError:
        logger.error(f"Course update failed: Invalid JSON data for Course ID {course_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Course update error for Course ID {course_id} by {request.user.email}: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e)
        }, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["DELETE"])
def api_delete_course(request, course_id):
    """API endpoint to delete course"""
    logger.info(f"Course deletion attempt: Course ID {course_id} by {request.user.email}")
    course = get_object_or_404(Course, id=course_id)
    
    # Only course owner or admin can delete
    if request.user.user_role != 'admin' and course.created_by != request.user:
        logger.warning(f"Unauthorized course deletion attempt: Course ID {course_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Permission denied'
        }, status=403)
    
    course_title = course.title
    course.delete()
    
    logger.info(f"Course deleted successfully: '{course_title}' (ID: {course_id}) by {request.user.email}")
    return JsonResponse({
        'success': True,
        'message': 'Course deleted successfully'
    })


@jwt_required
def api_lessons_list(request):
    """API endpoint to list lessons"""
    course_id = request.GET.get('course')
    logger.info(f"Lessons list accessed by: {request.user.email} (Course ID: {course_id if course_id else 'all'})")
    lessons = Lesson.objects.select_related('course').all().order_by('course', 'order')
    
    # Filter by course if specified
    if course_id:
        lessons = lessons.filter(course=course_id)
    
    # If user is not admin or professor, only show lessons from active courses
    if request.user.user_role not in ['admin', 'professor']:
        lessons = lessons.filter(course__is_active=True)
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(lessons, 20)
    lessons_page = paginator.get_page(page)
    
    lessons_data = []
    for lesson in lessons_page:
        lessons_data.append({
            'id': lesson.id,
            'course': lesson.course.id,
            'course_title': lesson.course.title,
            'title': lesson.title,
            'short_description': lesson.short_description,
            'full_text': lesson.full_text,
            'order': lesson.order,
            'image_url': lesson.image.url if lesson.image else None,
            'created_at': lesson.created_at.isoformat(),
            'updated_at': lesson.updated_at.isoformat(),
        })
    
    return JsonResponse({
        'success': True,
        'lessons': lessons_data,
        'pagination': {
            'current_page': lessons_page.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': lessons_page.has_next(),
            'has_previous': lessons_page.has_previous(),
        }
    })


@jwt_required
def api_lesson_detail(request, lesson_id):
    """API endpoint to get lesson details"""
    logger.info(f"Lesson detail accessed: Lesson ID {lesson_id} by {request.user.email}")
    lesson = get_object_or_404(Lesson, id=lesson_id)
    
    # If user is not admin or professor, only show lessons from active courses
    if request.user.user_role not in ['admin', 'professor'] and not lesson.course.is_active:
        logger.warning(f"Unauthorized access to inactive course lesson: Lesson ID {lesson_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Lesson not found'
        }, status=404)
    
    lesson_data = {
        'id': lesson.id,
        'course': lesson.course.id,
        'course_title': lesson.course.title,
        'title': lesson.title,
        'short_description': lesson.short_description,
        'full_text': lesson.full_text,
        'order': lesson.order,
        'image_url': lesson.image.url if lesson.image else None,
        'created_at': lesson.created_at.isoformat(),
        'updated_at': lesson.updated_at.isoformat(),
    }
    
    return JsonResponse({
        'success': True,
        'lesson': lesson_data
    })


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def api_create_lesson(request):
    """API endpoint to create a new lesson"""
    logger.info(f"Lesson creation attempt by: {request.user.email}")
    # Only admin and professor can create lessons
    if request.user.user_role not in ['admin', 'professor']:
        logger.warning(f"Unauthorized lesson creation attempt by: {request.user.email}")
        return JsonResponse({
            'error': 'Only admin and professor users can create lessons'
        }, status=403)
    
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['course', 'title', 'short_description', 'full_text']
        for field in required_fields:
            if not data.get(field):
                logger.warning(f"Lesson creation failed: Missing {field} by {request.user.email}")
                return JsonResponse({
                    'error': f'{field} is required'
                }, status=400)
        
        # Get course
        course = get_object_or_404(Course, id=data['course'])
        
        # Check if user can create lessons for this course
        if request.user.user_role != 'admin' and course.created_by != request.user:
            logger.warning(f"Unauthorized lesson creation attempt for Course ID {course.id} by {request.user.email}")
            return JsonResponse({
                'error': 'Permission denied'
            }, status=403)
        
        # Validate order is unique for this course
        order = data.get('order', 1)
        if Lesson.objects.filter(course=course, order=order).exists():
            logger.warning(f"Lesson creation failed: Order {order} already exists for Course ID {course.id}")
            return JsonResponse({
                'error': f'A lesson with order {order} already exists for this course. Please choose a different order.'
            }, status=400)
        
        # Create lesson
        lesson = Lesson.objects.create(
            course=course,
            title=data['title'],
            short_description=data['short_description'],
            full_text=data['full_text'],
            order=order
        )
        
        logger.info(f"Lesson created successfully: '{lesson.title}' (ID: {lesson.id}) for Course ID {course.id} by {request.user.email}")
        
        lesson_data = {
            'id': lesson.id,
            'course': lesson.course.id,
            'course_title': lesson.course.title,
            'title': lesson.title,
            'short_description': lesson.short_description,
            'full_text': lesson.full_text,
            'order': lesson.order,
            'image_url': lesson.image.url if lesson.image else None,
            'created_at': lesson.created_at.isoformat(),
            'updated_at': lesson.updated_at.isoformat(),
        }
        
        return JsonResponse({
            'success': True,
            'message': 'Lesson created successfully',
            'lesson': lesson_data
        }, status=201)
        
    except json.JSONDecodeError:
        logger.error(f"Lesson creation failed: Invalid JSON data by {request.user.email}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Lesson creation error by {request.user.email}: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e)
        }, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["PUT"])
def api_update_lesson(request, lesson_id):
    """API endpoint to update lesson"""
    logger.info(f"Lesson update attempt: Lesson ID {lesson_id} by {request.user.email}")
    lesson = get_object_or_404(Lesson, id=lesson_id)
    
    # Only course owner or admin can update
    if request.user.user_role != 'admin' and lesson.course.created_by != request.user:
        logger.warning(f"Unauthorized lesson update attempt: Lesson ID {lesson_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Permission denied'
        }, status=403)
    
    try:
        data = json.loads(request.body)
        
        # Update lesson fields
        if 'title' in data:
            lesson.title = data['title']
        if 'short_description' in data:
            lesson.short_description = data['short_description']
        if 'full_text' in data:
            lesson.full_text = data['full_text']
        if 'order' in data:
            new_order = data['order']
            # Validate order is unique for this course (excluding current lesson)
            if Lesson.objects.filter(course=lesson.course, order=new_order).exclude(id=lesson.id).exists():
                logger.warning(f"Lesson update failed: Order {new_order} already exists for Course ID {lesson.course.id}")
                return JsonResponse({
                    'error': f'A lesson with order {new_order} already exists for this course. Please choose a different order.'
                }, status=400)
            lesson.order = new_order
        
        lesson.save()
        
        logger.info(f"Lesson updated successfully: '{lesson.title}' (ID: {lesson.id}) by {request.user.email}")
        
        lesson_data = {
            'id': lesson.id,
            'course': lesson.course.id,
            'course_title': lesson.course.title,
            'title': lesson.title,
            'short_description': lesson.short_description,
            'full_text': lesson.full_text,
            'order': lesson.order,
            'image_url': lesson.image.url if lesson.image else None,
            'created_at': lesson.created_at.isoformat(),
            'updated_at': lesson.updated_at.isoformat(),
        }
        
        return JsonResponse({
            'success': True,
            'message': 'Lesson updated successfully',
            'lesson': lesson_data
        })
        
    except json.JSONDecodeError:
        logger.error(f"Lesson update failed: Invalid JSON data for Lesson ID {lesson_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Lesson update error for Lesson ID {lesson_id} by {request.user.email}: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e)
        }, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["DELETE"])
def api_delete_lesson(request, lesson_id):
    """API endpoint to delete lesson"""
    logger.info(f"Lesson deletion attempt: Lesson ID {lesson_id} by {request.user.email}")
    lesson = get_object_or_404(Lesson, id=lesson_id)
    
    # Only course owner or admin can delete
    if request.user.user_role != 'admin' and lesson.course.created_by != request.user:
        logger.warning(f"Unauthorized lesson deletion attempt: Lesson ID {lesson_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Permission denied'
        }, status=403)
    
    lesson_title = lesson.title
    lesson.delete()
    
    logger.info(f"Lesson deleted successfully: '{lesson_title}' (ID: {lesson_id}) by {request.user.email}")
    return JsonResponse({
        'success': True,
        'message': 'Lesson deleted successfully'
    })