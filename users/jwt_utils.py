import jwt
import datetime
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import JsonResponse

User = get_user_model()


class JWTManager:
    """JWT token management utility class"""
    
    @staticmethod
    def generate_access_token(user):
        """Generate access token for user"""
        payload = {
            'user_id': user.id,
            'email': user.email,
            'user_role': user.user_role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=settings.JWT_ACCESS_TOKEN_LIFETIME),
            'iat': datetime.datetime.utcnow(),
            'type': 'access'
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def generate_refresh_token(user):
        """Generate refresh token for user"""
        payload = {
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=settings.JWT_REFRESH_TOKEN_LIFETIME),
            'iat': datetime.datetime.utcnow(),
            'type': 'refresh'
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def verify_token(token):
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def get_user_from_token(token):
        """Get user object from JWT token"""
        payload = JWTManager.verify_token(token)
        if payload and 'user_id' in payload:
            try:
                return User.objects.get(id=payload['user_id'])
            except User.DoesNotExist:
                return None
        return None
    
    @staticmethod
    def refresh_access_token(refresh_token):
        """Generate new access token from refresh token"""
        payload = JWTManager.verify_token(refresh_token)
        if payload and payload.get('type') == 'refresh' and 'user_id' in payload:
            try:
                user = User.objects.get(id=payload['user_id'])
                return JWTManager.generate_access_token(user)
            except User.DoesNotExist:
                return None
        return None


def get_token_from_request(request):
    """Extract JWT token from request headers"""
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]
    return None


def jwt_required(view_func):
    """Decorator to require JWT authentication"""
    def wrapper(request, *args, **kwargs):
        token = get_token_from_request(request)
        if not token:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        user = JWTManager.get_user_from_token(token)
        if not user:
            return JsonResponse({'error': 'Invalid or expired token'}, status=401)
        
        if not user.is_active:
            return JsonResponse({'error': 'User account is disabled'}, status=401)
        
        # Add user to request for use in view
        request.user = user
        return view_func(request, *args, **kwargs)
    
    return wrapper
