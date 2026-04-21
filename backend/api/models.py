from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_STUDENT = "student"
    ROLE_TEACHER = "teacher"
    ROLE_ADMIN = "admin"

    ROLE_CHOICES = [
        (ROLE_STUDENT, "Student"),
        (ROLE_TEACHER, "Teacher"),
        (ROLE_ADMIN, "Admin"),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STUDENT)

    def __str__(self):
        return self.username
    
class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    teacher_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    credits = models.PositiveIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class Enrollment(models.Model):
    student_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    course_id = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student_id', 'course_id'], name='unique_student_course_enrollment'),
        ]

    def __str__(self):
        return f"{self.student_id.username} enrolled in {self.course_id.name}"
    
class Tasks(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    deadline = models.DateTimeField()
    course_id = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='tasks')
    max_points = models.PositiveIntegerField(default=100)
    file_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class Submissions(models.Model):
    task_id = models.ForeignKey(Tasks, on_delete=models.CASCADE, related_name='submissions')
    student_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    file_url = models.URLField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    is_late = models.BooleanField(default=False)
    grade = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['task_id', 'student_id'], name='unique_submission_per_task_student'),
        ]

    def __str__(self):
        return f"{self.student_id.username} submission for {self.task_id.name}"

class Announcements(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    course_id = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='announcements')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Materials(models.Model):
    title = models.CharField(max_length=255)
    file_url = models.URLField()
    course_id = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
