from django.db import models
from django.core.validators import EmailValidator
import os


def user_picture_path(instance, filename):
    # File will be uploaded to MEDIA_ROOT/users/user_<id>/<filename>
    ext = filename.split('.')[-1]
    filename = f'profile_picture.{ext}'
    return os.path.join('users', f'user_{instance.id}', filename)


class User(models.Model):
    USER_ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('student', 'Student'),
        ('professor', 'Professor'),
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    father_name = models.CharField(max_length=100, blank=True, null=True)

    user_role = models.CharField(
        max_length=10,
        choices=USER_ROLE_CHOICES,
        default='student'
    )

    email = models.EmailField(
        max_length=255,
        unique=True,
        validators=[EmailValidator()]
    )

    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    picture = models.ImageField(
        upload_to=user_picture_path,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def get_full_name(self):
        """Return the full name of the user"""
        names = [self.first_name]
        if self.father_name:
            names.append(self.father_name)
        names.append(self.last_name)
        return ' '.join(names)

    def delete(self, *args, **kwargs):
        # Delete the picture file when user is deleted
        if self.picture:
            if os.path.isfile(self.picture.path):
                os.remove(self.picture.path)
        super().delete(*args, **kwargs)
