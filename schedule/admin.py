from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'assigned_date', 'created_at')
    list_filter = ('assigned_date', 'created_at', 'creator')
    search_fields = ('title', 'description', 'creator__email')
    date_hierarchy = 'assigned_date'
    ordering = ('-assigned_date', '-created_at')