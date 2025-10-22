from django.contrib import admin
from django.utils.html import format_html
from .models import Course, Lesson


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ['order', 'title', 'short_description', 'created_at']
    readonly_fields = ['created_at']
    ordering = ['order']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'lessons_count_display', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at', 'created_by__user_role']
    search_fields = ['title', 'description', 'created_by__first_name', 'created_by__last_name']
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    inlines = [LessonInline]
    
    fieldsets = (
        ('Course Information', {
            'fields': ('title', 'description', 'image', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def lessons_count_display(self, obj):
        count = obj.lessons.count()
        return format_html(
            '<span style="color: {};">{}</span>',
            'green' if count > 0 else 'red',
            count
        )
    lessons_count_display.short_description = 'Lessons Count'
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new course
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'course', 'order', 'created_at']
    list_filter = ['course', 'created_at', 'course__is_active']
    search_fields = ['title', 'short_description', 'course__title']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['course', 'order']
    
    fieldsets = (
        ('Lesson Information', {
            'fields': ('course', 'title', 'short_description', 'full_text', 'order', 'image')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('course')

