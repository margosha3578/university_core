from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField(required=False)

    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'last_name',
            'father_name',
            'full_name',
            'user_role',
            'email',
            'phone_number',
            'date_of_birth',
            'age',
            'picture',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                    (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None

    def validate_email(self, value):
        # Check if email is unique (excluding current instance during update)
        if self.instance:
            if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        else:
            if User.objects.filter(email=value).exists():
                raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_user_role(self, value):
        valid_roles = [choice[0] for choice in User.USER_ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(f"User role must be one of: {', '.join(valid_roles)}")
        return value


class UserCreateSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields.copy()
        # Remove read-only fields for creation
        read_only_fields = [f for f in UserSerializer.Meta.read_only_fields if f != 'id']


class UserUpdateSerializer(UserSerializer):
    class Meta(UserSerializer.Meta):
        # Make email read-only during updates to prevent changing it
        read_only_fields = UserSerializer.Meta.read_only_fields + ['email']
