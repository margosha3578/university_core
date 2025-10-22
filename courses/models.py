from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator
import os


def course_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'course_image.{ext}'
    return os.path.join('courses', f'course_{instance.id}', filename)


def lesson_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'lesson_image.{ext}'
    return os.path.join('lessons', f'lesson_{instance.id}', filename)


class Course(models.Model):
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        verbose_name='Course Title'
    )
    description = models.TextField(
        verbose_name='Course Description',
        help_text='Detailed description of the course'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_courses',
        verbose_name='Created By'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date Created')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Date Updated')
    is_active = models.BooleanField(default=True, verbose_name='Active')
    
    # Optional course image
    image = models.ImageField(
        upload_to=course_image_path,
        blank=True,
        null=True,
        verbose_name='Course Image'
    )
    
    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
    
    def __str__(self):
        return self.title
    
    def delete(self, *args, **kwargs):
        # Delete the course image file when course is deleted
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)
    
    @property
    def lessons_count(self):
        return self.lessons.count()
    
    @property
    def created_by_name(self):
        return f"{self.created_by.first_name} {self.created_by.last_name}"


class Lesson(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name='Course'
    )
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(3)],
        verbose_name='Lesson Title'
    )
    short_description = models.CharField(
        max_length=300,
        verbose_name='Short Description',
        help_text='Brief description of the lesson'
    )
    full_text = models.TextField(
        verbose_name='Full Lesson Text',
        help_text='Complete lesson content'
    )
    order = models.PositiveIntegerField(
        default=1,
        verbose_name='Order',
        help_text='Order of lesson in the course'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date Created')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Date Updated')
    
    # Optional lesson image
    image = models.ImageField(
        upload_to=lesson_image_path,
        blank=True,
        null=True,
        verbose_name='Lesson Image'
    )
    
    class Meta:
        db_table = 'lessons'
        ordering = ['course', 'order']
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'
        unique_together = ['course', 'order']
    
    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
    def delete(self, *args, **kwargs):
        # Delete the lesson image file when lesson is deleted
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)
    
    def save(self, *args, **kwargs):
        # Auto-assign order if not provided
        if not self.order:
            max_order = Lesson.objects.filter(course=self.course).aggregate(
                models.Max('order')
            )['order__max'] or 0
            self.order = max_order + 1
        super().save(*args, **kwargs)

