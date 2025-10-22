from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Fields to display in the list view
    list_display = [
        'email',
        'first_name',
        'last_name',
        'user_role',
        'phone_number',
        'is_active',
        'is_staff',
        'created_at'
    ]
    
    # Filters for the list view
    list_filter = [
        'user_role', 
        'is_active', 
        'is_staff', 
        'is_superuser',
        'created_at'
    ]
    
    # Search fields
    search_fields = [
        'first_name', 
        'last_name', 
        'email', 
        'phone_number'
    ]
    
    # Read-only fields
    readonly_fields = [
        'created_at', 
        'updated_at',
        'last_login',
        'date_joined'
    ]
    
    # Ordering
    ordering = ['email']
    
    # Fieldsets for the edit form
    fieldsets = (
        ('Authentication', {
            'fields': (
                'email',
                'password',
                'last_login',
                'date_joined'
            )
        }),
        ('Personal Information', {
            'fields': (
                'first_name',
                'last_name',
                'father_name',
                'date_of_birth',
                'picture'
            )
        }),
        ('Contact Information', {
            'fields': ('phone_number',)
        }),
        ('Role & Permissions', {
            'fields': (
                'user_role',
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    # Fieldsets for the add form
    add_fieldsets = (
        ('Authentication', {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
        ('Personal Information', {
            'fields': (
                'first_name',
                'last_name',
                'father_name',
                'date_of_birth'
            )
        }),
        ('Contact Information', {
            'fields': ('phone_number',)
        }),
        ('Role & Permissions', {
            'fields': (
                'user_role',
                'is_active',
                'is_staff',
                'is_superuser'
            )
        }),
    )
    
    # Filter horizontal for many-to-many fields
    filter_horizontal = ('groups', 'user_permissions',)
    
    def get_full_name_display(self, obj):
        """Display full name with role badge"""
        role_colors = {
            'admin': '#dc3545',
            'professor': '#fd7e14', 
            'student': '#28a745'
        }
        role_color = role_colors.get(obj.user_role, '#6c757d')
        return format_html(
            '<span style="color: {};">●</span> {} {}',
            role_color,
            obj.first_name,
            obj.last_name
        )
    get_full_name_display.short_description = 'Full Name'
