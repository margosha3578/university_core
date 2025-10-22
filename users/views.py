import json
import logging
from datetime import datetime
from django.shortcuts import render, get_object_or_404
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator

from .models import User
from .jwt_utils import JWTManager, jwt_required

# Get logger for this module
logger = logging.getLogger(__name__)


def home_view(request):
    """Homepage view that serves the frontend template"""
    logger.info(f"Home page accessed from IP: {request.META.get('REMOTE_ADDR')}")
    context = {
        'user': request.user if request.user.is_authenticated else None,
        'is_authenticated': request.user.is_authenticated,
    }
    return render(request, 'frontend/index.html', context)


@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    """API endpoint for user login"""
    logger.info(f"Login attempt from IP: {request.META.get('REMOTE_ADDR')}")
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            logger.warning(f"Login failed: Missing email or password from IP: {request.META.get('REMOTE_ADDR')}")
            return JsonResponse({
                'error': 'Email and password are required'
            }, status=400)
        
        logger.debug(f"Authenticating user: {email}")
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            if user.is_active:
                # Generate JWT tokens
                access_token = JWTManager.generate_access_token(user)
                refresh_token = JWTManager.generate_refresh_token(user)
                
                # Return user data (excluding sensitive fields)
                user_data = {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'full_name': user.get_full_name(),
                    'user_role': user.user_role,
                    'phone_number': user.phone_number,
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'updated_at': user.updated_at.isoformat() if user.updated_at else None,
                }
                
                logger.info(f"User logged in successfully: {email} (ID: {user.id})")
                return JsonResponse({
                    'success': True,
                    'message': 'Login successful',
                    'user': user_data,
                    'access_token': access_token,
                    'refresh_token': refresh_token
                })
            else:
                logger.warning(f"Login failed: User account disabled - {email}")
                return JsonResponse({
                    'error': 'User account is disabled'
                }, status=400)
        else:
            logger.warning(f"Login failed: Invalid credentials for email: {email}")
            return JsonResponse({
                'error': 'Invalid credentials'
            }, status=401)
            
    except json.JSONDecodeError:
        logger.error(f"Login failed: Invalid JSON data from IP: {request.META.get('REMOTE_ADDR')}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_refresh_token(request):
    """API endpoint for refreshing JWT access token"""
    logger.info(f"Token refresh attempt from IP: {request.META.get('REMOTE_ADDR')}")
    try:
        data = json.loads(request.body)
        refresh_token = data.get('refresh_token')
        
        if not refresh_token:
            logger.warning(f"Token refresh failed: No refresh token provided from IP: {request.META.get('REMOTE_ADDR')}")
            return JsonResponse({
                'error': 'Refresh token is required'
            }, status=400)
        
        # Generate new access token from refresh token
        new_access_token = JWTManager.refresh_access_token(refresh_token)
        
        if new_access_token:
            logger.info(f"Token refreshed successfully from IP: {request.META.get('REMOTE_ADDR')}")
            return JsonResponse({
                'success': True,
                'access_token': new_access_token
            })
        else:
            logger.warning(f"Token refresh failed: Invalid or expired token from IP: {request.META.get('REMOTE_ADDR')}")
            return JsonResponse({
                'error': 'Invalid or expired refresh token'
            }, status=401)
            
    except json.JSONDecodeError:
        logger.error(f"Token refresh failed: Invalid JSON data from IP: {request.META.get('REMOTE_ADDR')}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': f'Token refresh failed: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_logout(request):
    """API endpoint for user logout"""
    logger.info(f"User logout from IP: {request.META.get('REMOTE_ADDR')}")
    # With JWT, logout is handled client-side by removing tokens
    # No server-side session to invalidate
    return JsonResponse({
        'success': True,
        'message': 'Logout successful'
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_register(request):
    """API endpoint for user registration"""
    logger.info(f"User registration attempt from IP: {request.META.get('REMOTE_ADDR')}")
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                logger.warning(f"Registration failed: Missing {field} from IP: {request.META.get('REMOTE_ADDR')}")
                return JsonResponse({
                    'error': f'{field} is required'
                }, status=400)
        
        email = data['email']
        logger.debug(f"Attempting to register user: {email}")
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            logger.warning(f"Registration failed: Email already exists - {email}")
            return JsonResponse({
                'error': 'A user with this email already exists'
            }, status=400)
        
        # Create user
        user = User.objects.create_user(
            email=email,
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            father_name=data.get('father_name', ''),
            user_role=data.get('user_role', 'student'),
            phone_number=data.get('phone_number', ''),
        )
        
        # Auto-login after registration
        login(request, user)
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_role': user.user_role,
            'is_active': user.is_active,
        }
        
        logger.info(f"User registered successfully: {email} (ID: {user.id})")
        return JsonResponse({
            'success': True,
            'message': 'User registered successfully',
            'user': user_data
        }, status=201)
        
    except json.JSONDecodeError:
        logger.error(f"Registration failed: Invalid JSON data from IP: {request.META.get('REMOTE_ADDR')}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e)
        }, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["GET", "PUT"])
def api_user_profile(request):
    """API endpoint to get and update current user profile"""
    if request.method == 'GET':
        logger.info(f"User profile accessed: {request.user.email} (ID: {request.user.id})")
        user_data = {
            'id': request.user.id,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'father_name': request.user.father_name,
            'role': request.user.user_role,
            'phone_number': request.user.phone_number,
            'is_active': request.user.is_active,
            'date_of_birth': request.user.date_of_birth.isoformat() if request.user.date_of_birth else None,
            'created_at': request.user.created_at.isoformat(),
            'updated_at': request.user.updated_at.isoformat(),
        }
        
        return JsonResponse({
            'success': True,
            'user': user_data
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            user = request.user
            
            # Update user fields
            user.first_name = data.get('first_name', user.first_name)
            user.last_name = data.get('last_name', user.last_name)
            user.father_name = data.get('father_name', user.father_name)
            user.phone_number = data.get('phone_number', user.phone_number)
            user.is_active = data.get('is_active', user.is_active)
            
            # Handle date_of_birth
            date_of_birth = data.get('date_of_birth')
            if date_of_birth:
                user.date_of_birth = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
            
            user.save()
            
            logger.info(f"User profile updated: {user.email} (ID: {user.id})")
            return JsonResponse({
                'success': True,
                'message': 'Profile updated successfully!'
            })
            
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON received for profile update by user {request.user.email}")
            return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
        except Exception as e:
            logger.error(f"Error updating profile for user {request.user.email}: {e}", exc_info=True)
            return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def api_change_password(request):
    """API endpoint to change user password"""
    try:
        data = json.loads(request.body)
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        if not current_password or not new_password or not confirm_password:
            logger.warning(f"Password change failed for user {request.user.email}: Missing required fields")
            return JsonResponse({'success': False, 'error': 'All password fields are required.'}, status=400)
        
        if new_password != confirm_password:
            logger.warning(f"Password change failed for user {request.user.email}: Passwords do not match")
            return JsonResponse({'success': False, 'error': 'New passwords do not match.'}, status=400)
        
        if len(new_password) < 8:
            logger.warning(f"Password change failed for user {request.user.email}: Password too short")
            return JsonResponse({'success': False, 'error': 'New password must be at least 8 characters long.'}, status=400)
        
        # Verify current password
        if not request.user.check_password(current_password):
            logger.warning(f"Password change failed for user {request.user.email}: Incorrect current password")
            return JsonResponse({'success': False, 'error': 'Current password is incorrect.'}, status=400)
        
        # Set new password
        request.user.set_password(new_password)
        request.user.save()
        
        logger.info(f"Password changed successfully for user {request.user.email} (ID: {request.user.id})")
        return JsonResponse({
            'success': True,
            'message': 'Password changed successfully!'
        })
        
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON received for password change by user {request.user.email}")
        return JsonResponse({'success': False, 'error': 'Invalid JSON.'}, status=400)
    except Exception as e:
        logger.error(f"Error changing password for user {request.user.email}: {e}", exc_info=True)
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@jwt_required
def api_users_list(request):
    """API endpoint to list users"""
    logger.info(f"Users list accessed by: {request.user.email} (Role: {request.user.user_role})")
    # Only admin can see all users
    if request.user.user_role != 'admin':
        logger.warning(f"Unauthorized users list access attempt by: {request.user.email}")
        return JsonResponse({
            'error': 'Permission denied'
        }, status=403)
    
    users = User.objects.all().order_by('-created_at')
    
    # Pagination
    page = request.GET.get('page', 1)
    paginator = Paginator(users, 20)
    users_page = paginator.get_page(page)
    
    users_data = []
    for user in users_page:
        users_data.append({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.full_name,
            'phone_number': user.phone_number,
            'user_role': user.user_role,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat(),
        })
    
    return JsonResponse({
        'success': True,
        'users': users_data,
        'pagination': {
            'current_page': users_page.number,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
            'has_next': users_page.has_next(),
            'has_previous': users_page.has_previous(),
        }
    })


@csrf_exempt
@jwt_required
def api_user_detail(request, user_id):
    """API endpoint to get user details"""
    logger.info(f"User detail accessed: User ID {user_id} by {request.user.email}")
    # Only admin can see other users' details
    if request.user.user_role != 'admin' and request.user.id != user_id:
        logger.warning(f"Unauthorized user detail access attempt: User ID {user_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Permission denied'
        }, status=403)
    
    user = get_object_or_404(User, id=user_id)
    
    user_data = {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'father_name': user.father_name,
        'user_role': user.user_role,
        'phone_number': user.phone_number,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat(),
        'updated_at': user.updated_at.isoformat(),
    }
    
    return JsonResponse({
        'success': True,
                'user': user_data
            })


@csrf_exempt
@jwt_required
@require_http_methods(["POST"])
def api_create_user(request):
    """API endpoint to create a new user (admin only)"""
    logger.info(f"User creation attempt by: {request.user.email}")
    if request.user.user_role != 'admin':
        logger.warning(f"Unauthorized user creation attempt by: {request.user.email}")
        return JsonResponse({
            'error': 'Only admin users can create new users'
        }, status=403)
    
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'error': f'{field} is required'
                }, status=400)
        
        # Check if user already exists
        if User.objects.filter(email=data['email']).exists():
            return JsonResponse({
                'error': 'A user with this email already exists'
            }, status=400)
        
        # Create user
        user = User.objects.create_user(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            father_name=data.get('father_name', ''),
            user_role=data.get('user_role', 'student'),
            phone_number=data.get('phone_number', ''),
            date_of_birth=data.get('date_of_birth') if data.get('date_of_birth') else None,
            is_active=data.get('is_active', True)
        )
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_role': user.user_role,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat(),
        }
        
        logger.info(f"User created successfully: {user.email} (ID: {user.id}) by {request.user.email}")
        return JsonResponse({
            'success': True,
            'message': 'User created successfully',
            'user': user_data
        }, status=201)
        
    except json.JSONDecodeError:
        logger.error(f"User creation failed: Invalid JSON data by {request.user.email}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"User creation error by {request.user.email}: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e)
        }, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["PUT"])
def api_update_user(request, user_id):
    """API endpoint to update user (admin only)"""
    logger.info(f"User update attempt: User ID {user_id} by {request.user.email}")
    if request.user.user_role != 'admin':
        logger.warning(f"Unauthorized user update attempt: User ID {user_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Only admin users can update users'
        }, status=403)
    
    user = get_object_or_404(User, id=user_id)
    
    try:
        data = json.loads(request.body)
        
        # Update user fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'father_name' in data:
            user.father_name = data['father_name']
        if 'user_role' in data:
            user.user_role = data['user_role']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        if 'date_of_birth' in data:
            user.date_of_birth = data['date_of_birth'] if data['date_of_birth'] else None
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        user.save()
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'father_name': user.father_name,
            'user_role': user.user_role,
            'phone_number': user.phone_number,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat(),
        }
        
        logger.info(f"User updated successfully: {user.email} (ID: {user.id}) by {request.user.email}")
        return JsonResponse({
            'success': True,
            'message': 'User updated successfully',
            'user': user_data
        })
        
    except json.JSONDecodeError:
        logger.error(f"User update failed: Invalid JSON data for User ID {user_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"User update error for User ID {user_id} by {request.user.email}: {str(e)}", exc_info=True)
        return JsonResponse({
            'error': str(e)
        }, status=500)


@csrf_exempt
@jwt_required
@require_http_methods(["DELETE"])
def api_delete_user(request, user_id):
    """API endpoint to delete user (admin only)"""
    logger.info(f"User deletion attempt: User ID {user_id} by {request.user.email}")
    if request.user.user_role != 'admin':
        logger.warning(f"Unauthorized user deletion attempt: User ID {user_id} by {request.user.email}")
        return JsonResponse({
            'error': 'Only admin users can delete users'
        }, status=403)
    
    user = get_object_or_404(User, id=user_id)
    
    # Don't allow deleting yourself
    if user.id == request.user.id:
        logger.warning(f"User attempted to delete their own account: {request.user.email}")
        return JsonResponse({
            'error': 'You cannot delete your own account'
        }, status=400)
    
    user_email = user.email
    user.delete()
    
    logger.info(f"User deleted successfully: {user_email} (ID: {user_id}) by {request.user.email}")
    return JsonResponse({
        'success': True,
        'message': 'User deleted successfully'
    })