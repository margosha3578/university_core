from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.core.validators import EmailValidator
from django.utils import timezone
import os


def user_picture_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f'profile_picture.{ext}'
    return os.path.join('users', f'user_{instance.id}', filename)


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and return a regular user with an email and password.
        """
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and return a superuser with an email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    USER_ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('student', 'Student'),
        ('professor', 'Professor'),
    )

    # Authentication fields
    email = models.EmailField(
        max_length=255,
        unique=True,
        validators=[EmailValidator()],
        verbose_name='email address'
    )

    # Personal info
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    father_name = models.CharField(max_length=100, blank=True, null=True)

    user_role = models.CharField(
        max_length=10,
        choices=USER_ROLE_CHOICES,
        default='student'
    )

    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    picture = models.ImageField(
        upload_to=user_picture_path,
        blank=True,
        null=True
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Django auth required fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Django auth additional fields
    last_login = models.DateTimeField(blank=True, null=True)
    date_joined = models.DateTimeField(default=timezone.now)

    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        """Return the full name of the user"""
        names = [self.first_name]
        if self.father_name:
            names.append(self.father_name)
        names.append(self.last_name)
        return ' '.join(names)

    def get_full_name(self):
        """Return the full name of the user"""
        return self.full_name

    def get_short_name(self):
        """Return the short name for the user"""
        return self.first_name

    def has_perm(self, perm, obj=None):
        """Does the user have a specific permission?"""
        return self.is_superuser

    def has_module_perms(self, app_label):
        """Does the user have permissions to view the app `app_label`?"""
        return self.is_superuser

    def delete(self, *args, **kwargs):
        # Delete the picture file when user is deleted
        if self.picture:
            if os.path.isfile(self.picture.path):
                os.remove(self.picture.path)
        super().delete(*args, **kwargs)
