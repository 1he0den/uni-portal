from rest_framework import serializers # type: ignore
from .models import User, Course, Enrollment, Tasks, Submissions, Announcements, Materials


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name", "role"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "name", "description", "teacher_id", "credits", "created_at"]
        read_only_fields = ["id", "teacher_id", "created_at"]

class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ["id", "student_id", "course_id", "enrolled_at"]
        read_only_fields = ["id", "student_id", "enrolled_at"]

class TasksSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tasks
        fields = ["id", "name", "description", "deadline", "course_id", "max_points", "file_url", "created_at"]
        read_only_fields = ["id", "created_at"]

class SubmissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submissions
        fields = ["id", "task_id", "student_id", "file_url", "submitted_at", "is_late", "grade", "feedback"]
        read_only_fields = ["id", "student_id", "submitted_at", "is_late"]

class AnnouncementsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcements
        fields = ["id", "title", "content", "course_id", "created_at"]
        read_only_fields = ["id", "created_at"]

class MaterialsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materials
        fields = ["id", "title", "file_url", "course_id", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]
