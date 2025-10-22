from django.urls import path
from . import views

urlpatterns = [
    # Course endpoints
    path('', views.api_courses_list, name='api-courses-list'),
    path('<int:course_id>/', views.api_course_detail, name='api-course-detail'),
    path('create/', views.api_create_course, name='api-create-course'),
    path('<int:course_id>/update/', views.api_update_course, name='api-update-course'),
    path('<int:course_id>/delete/', views.api_delete_course, name='api-delete-course'),
    
    # Lesson endpoints
    path('lessons/', views.api_lessons_list, name='api-lessons-list'),
    path('lessons/<int:lesson_id>/', views.api_lesson_detail, name='api-lesson-detail'),
    path('lessons/create/', views.api_create_lesson, name='api-create-lesson'),
    path('lessons/<int:lesson_id>/update/', views.api_update_lesson, name='api-update-lesson'),
    path('lessons/<int:lesson_id>/delete/', views.api_delete_lesson, name='api-delete-lesson'),
]