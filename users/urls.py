from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('login/', views.api_login, name='api-login'),
    path('logout/', views.api_logout, name='api-logout'),
    path('register/', views.api_register, name='api-register'),
    path('refresh-token/', views.api_refresh_token, name='api-refresh-token'),
    
    # User management endpoints
    path('profile/', views.api_user_profile, name='api-user-profile'),
    path('change-password/', views.api_change_password, name='api-change-password'),
    path('', views.api_users_list, name='api-users-list'),
    path('<int:user_id>/', views.api_user_detail, name='api-user-detail'),
    path('create/', views.api_create_user, name='api-create-user'),
    path('<int:user_id>/update/', views.api_update_user, name='api-update-user'),
    path('<int:user_id>/delete/', views.api_delete_user, name='api-delete-user'),
]