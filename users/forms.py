from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User


class UserRegistrationForm(UserCreationForm):
    """Form for user registration"""
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=100, required=True)
    last_name = forms.CharField(max_length=100, required=True)
    father_name = forms.CharField(max_length=100, required=False)
    user_role = forms.ChoiceField(
        choices=User.USER_ROLE_CHOICES,
        initial='student',
        required=True
    )
    phone_number = forms.CharField(max_length=20, required=False)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'father_name', 
                 'user_role', 'phone_number', 'password1', 'password2')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.father_name = self.cleaned_data['father_name']
        user.user_role = self.cleaned_data['user_role']
        user.phone_number = self.cleaned_data['phone_number']
        
        if commit:
            user.save()
        return user

