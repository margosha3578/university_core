from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def list(self, request):
        """Get all users"""
        queryset = self.get_queryset()

        # Basic filtering
        user_role = request.query_params.get('role')
        if user_role:
            queryset = queryset.filter(user_role=user_role)

        # Search by name or email
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(email__icontains=search)
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Get specific user by ID"""
        user = get_object_or_404(User, pk=pk)
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def create(self, request):
        """Create new user"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                self.get_serializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """Update user (full update)"""
        user = get_object_or_404(User, pk=pk)
        serializer = self.get_serializer(user, data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(self.get_serializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, pk=None):
        """Update user (partial update)"""
        user = get_object_or_404(User, pk=pk)
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            user = serializer.save()
            return Response(self.get_serializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """Delete user"""
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(
            {'message': 'User deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=False, methods=['get'])
    def roles(self, request):
        """Get available user roles"""
        roles = [{'value': choice[0], 'label': choice[1]}
                 for choice in User.USER_ROLE_CHOICES]
        return Response(roles)


def home_view(request):
    """
    Homepage view that serves the frontend template
    """
    # For now, we'll use a mock user since Django's auth system isn't set up with our custom User model
    # In a real implementation, you'd integrate with Django's authentication system or your custom auth
    context = {
        'user': None,  # Will be replaced with actual user authentication
        'is_authenticated': False,  # Will be replaced with actual authentication check
    }
    return render(request, 'frontend/index.html', context)
