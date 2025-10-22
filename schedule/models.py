from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Event(models.Model):
    """Event model for schedule management"""
    
    EVENT_TYPES = [
        ('meeting', 'Meeting'),
        ('lecture', 'Lecture'),
        ('exam', 'Exam'),
        ('assignment', 'Assignment'),
        ('deadline', 'Deadline'),
        ('other', 'Other'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    title = models.CharField(max_length=200, help_text="Event title")
    description = models.TextField(blank=True, null=True, help_text="Event description")
    creator = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='created_events',
        help_text="User who created the event"
    )
    assigned_date = models.DateField(help_text="Date when the event is scheduled")
    start_time = models.TimeField(blank=True, null=True, help_text="Event start time")
    end_time = models.TimeField(blank=True, null=True, help_text="Event end time")
    event_type = models.CharField(
        max_length=20, 
        choices=EVENT_TYPES, 
        default='other',
        help_text="Type of event"
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_LEVELS, 
        default='medium',
        help_text="Event priority level"
    )
    location = models.CharField(max_length=200, blank=True, null=True, help_text="Event location")
    is_all_day = models.BooleanField(default=False, help_text="Whether this is an all-day event")
    is_recurring = models.BooleanField(default=False, help_text="Whether this event repeats")
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the event was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="When the event was last updated")
    
    class Meta:
        ordering = ['assigned_date', 'start_time']
        indexes = [
            models.Index(fields=['assigned_date']),
            models.Index(fields=['creator', 'assigned_date']),
            models.Index(fields=['event_type', 'assigned_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.assigned_date}"
    
    @property
    def duration(self):
        """Calculate event duration if both start and end times are provided"""
        if self.start_time and self.end_time:
            start = timezone.datetime.combine(timezone.datetime.today(), self.start_time)
            end = timezone.datetime.combine(timezone.datetime.today(), self.end_time)
            if end < start:  # Handle events that cross midnight
                end += timezone.timedelta(days=1)
            return end - start
        return None
    
    @property
    def is_past(self):
        """Check if the event is in the past"""
        today = timezone.now().date()
        return self.assigned_date < today
    
    @property
    def is_today(self):
        """Check if the event is today"""
        today = timezone.now().date()
        return self.assigned_date == today
    
    @property
    def is_upcoming(self):
        """Check if the event is in the future"""
        today = timezone.now().date()
        return self.assigned_date > today