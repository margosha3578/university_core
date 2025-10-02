from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = [
        'email',
        'first_name',
        'last_name',
        'user_role',
        'phone_number',
        'created_at'
    ]
    list_filter = ['user_role', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
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
            'fields': ('email', 'phone_number')
        }),
        ('Role Information', {
            'fields': ('user_role',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
