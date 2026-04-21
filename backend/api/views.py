from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Announcements, Course, Enrollment, Materials, Submissions, Tasks, User
from .serializers import (
	AnnouncementsSerializer,
	CourseSerializer,
	EnrollmentSerializer,
	LoginSerializer,
	LogoutSerializer,
	MaterialsSerializer,
	SubmissionsSerializer,
	TasksSerializer,
	UserSerializer,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
	serializer = LoginSerializer(data=request.data)
	serializer.is_valid(raise_exception=True)

	user = authenticate(
		request=request,
		username=serializer.validated_data["username"],
		password=serializer.validated_data["password"],
	)
	if not user:
		return Response({"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)

	refresh = RefreshToken.for_user(user)
	return Response(
		{
			"access": str(refresh.access_token),
			"refresh": str(refresh),
		},
		status=status.HTTP_200_OK,
	)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
	serializer = LogoutSerializer(data=request.data)
	serializer.is_valid(raise_exception=True)

	try:
		token = RefreshToken(serializer.validated_data["refresh"])
		token.blacklist()
	except TokenError:
		return Response({"detail": "Invalid or expired refresh token."}, status=status.HTTP_400_BAD_REQUEST)

	return Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)


class IsAdminRole(BasePermission):
	def has_permission(self, request, view):
		return bool(request.user and request.user.is_authenticated and request.user.role == User.ROLE_ADMIN)


class IsSelfOrAdmin(BasePermission):
	def has_object_permission(self, request, view, obj):
		if not request.user or not request.user.is_authenticated:
			return False
		return obj == request.user or request.user.role == User.ROLE_ADMIN


class CoursePermission(BasePermission):
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False
		if request.method in SAFE_METHODS:
			return True
		if view.action == "create":
			return request.user.role in [User.ROLE_TEACHER, User.ROLE_ADMIN]
		return True

	def has_object_permission(self, request, view, obj):
		if request.method in SAFE_METHODS:
			return True
		return request.user.role == User.ROLE_ADMIN or obj.teacher_id_id == request.user.id


class EnrollmentPermission(BasePermission):
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False
		if request.method in SAFE_METHODS:
			return True
		if view.action == "create":
			return request.user.role in [User.ROLE_STUDENT, User.ROLE_ADMIN]
		return True

	def has_object_permission(self, request, view, obj):
		if request.user.role == User.ROLE_ADMIN:
			return True
		if request.method in SAFE_METHODS:
			return obj.student_id_id == request.user.id or obj.course_id.teacher_id_id == request.user.id
		return obj.student_id_id == request.user.id


class TaskPermission(BasePermission):
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False
		if request.method in SAFE_METHODS:
			return True
		return request.user.role in [User.ROLE_TEACHER, User.ROLE_ADMIN]

	def has_object_permission(self, request, view, obj):
		if request.method in SAFE_METHODS:
			return True
		if request.user.role == User.ROLE_ADMIN:
			return True
		return obj.course_id.teacher_id_id == request.user.id


class SubmissionPermission(BasePermission):
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False
		if request.method in SAFE_METHODS:
			return True
		if view.action == "create":
			return request.user.role in [User.ROLE_STUDENT, User.ROLE_ADMIN]
		return request.user.role in [User.ROLE_TEACHER, User.ROLE_ADMIN]

	def has_object_permission(self, request, view, obj):
		if request.user.role == User.ROLE_ADMIN:
			return True
		if request.method in SAFE_METHODS:
			return obj.student_id_id == request.user.id or obj.task_id.course_id.teacher_id_id == request.user.id
		return obj.task_id.course_id.teacher_id_id == request.user.id


class CourseScopedContentPermission(BasePermission):
	def has_permission(self, request, view):
		if not request.user or not request.user.is_authenticated:
			return False
		if request.method in SAFE_METHODS:
			return True
		return request.user.role in [User.ROLE_TEACHER, User.ROLE_ADMIN]

	def has_object_permission(self, request, view, obj):
		if request.method in SAFE_METHODS:
			return True
		if request.user.role == User.ROLE_ADMIN:
			return True
		return obj.course_id.teacher_id_id == request.user.id


class ProfileAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		return Response(UserSerializer(request.user).data)


class TeacherCoursesAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, user_id):
		if request.user.role != User.ROLE_ADMIN and request.user.id != user_id:
			return Response({"detail": "You can only view your own courses."}, status=status.HTTP_403_FORBIDDEN)

		courses = Course.objects.filter(teacher_id_id=user_id).order_by("-created_at")
		return Response(CourseSerializer(courses, many=True).data)


class UserViewSet(viewsets.ModelViewSet):
	queryset = User.objects.all().order_by("id")
	serializer_class = UserSerializer

	def get_permissions(self):
		if self.action == "create":
			return [AllowAny()]
		if self.action in ["list", "destroy"]:
			return [IsAuthenticated(), IsAdminRole()]
		return [IsAuthenticated(), IsSelfOrAdmin()]


class CourseViewSet(viewsets.ModelViewSet):
	queryset = Course.objects.select_related("teacher_id").all().order_by("-created_at")
	serializer_class = CourseSerializer
	permission_classes = [CoursePermission]

	def perform_create(self, serializer):
		serializer.save(teacher_id=self.request.user)


class EnrollmentViewSet(viewsets.ModelViewSet):
	serializer_class = EnrollmentSerializer
	permission_classes = [EnrollmentPermission]

	def get_queryset(self):
		if self.request.user.role == User.ROLE_ADMIN:
			return Enrollment.objects.select_related("student_id", "course_id").all().order_by("-enrolled_at")
		if self.request.user.role == User.ROLE_TEACHER:
			return Enrollment.objects.select_related("student_id", "course_id").filter(course_id__teacher_id=self.request.user).order_by("-enrolled_at")
		return Enrollment.objects.select_related("student_id", "course_id").filter(student_id=self.request.user).order_by("-enrolled_at")

	def perform_create(self, serializer):
		serializer.save(student_id=self.request.user)


class TasksViewSet(viewsets.ModelViewSet):
	serializer_class = TasksSerializer
	permission_classes = [TaskPermission]

	def get_queryset(self):
		base_qs = Tasks.objects.select_related("course_id", "course_id__teacher_id").all().order_by("-created_at")
		if self.request.user.role == User.ROLE_ADMIN:
			return base_qs
		if self.request.user.role == User.ROLE_TEACHER:
			return base_qs.filter(course_id__teacher_id=self.request.user)
		return base_qs.filter(course_id__enrollments__student_id=self.request.user).distinct()

	def perform_create(self, serializer):
		if self.request.user.role != User.ROLE_ADMIN:
			selected_course = serializer.validated_data["course_id"]
			if selected_course.teacher_id_id != self.request.user.id:
				raise PermissionDenied("You can only add tasks to your own courses.")
		serializer.save()


class SubmissionsViewSet(viewsets.ModelViewSet):
	serializer_class = SubmissionsSerializer
	permission_classes = [SubmissionPermission]

	def get_queryset(self):
		base_qs = Submissions.objects.select_related("student_id", "task_id", "task_id__course_id", "task_id__course_id__teacher_id").all().order_by("-submitted_at")
		if self.request.user.role == User.ROLE_ADMIN:
			return base_qs
		if self.request.user.role == User.ROLE_TEACHER:
			return base_qs.filter(task_id__course_id__teacher_id=self.request.user)
		return base_qs.filter(student_id=self.request.user)

	def perform_create(self, serializer):
		task = serializer.validated_data["task_id"]
		is_late = timezone.now() > task.deadline
		serializer.save(student_id=self.request.user, is_late=is_late)


class AnnouncementsViewSet(viewsets.ModelViewSet):
	queryset = Announcements.objects.select_related("course_id", "course_id__teacher_id").all().order_by("-created_at")
	serializer_class = AnnouncementsSerializer
	permission_classes = [CourseScopedContentPermission]

	def perform_create(self, serializer):
		if self.request.user.role != User.ROLE_ADMIN and serializer.validated_data["course_id"].teacher_id_id != self.request.user.id:
			raise PermissionDenied("You can only post announcements for your own courses.")
		serializer.save()


class MaterialsViewSet(viewsets.ModelViewSet):
	queryset = Materials.objects.select_related("course_id", "course_id__teacher_id").all().order_by("-uploaded_at")
	serializer_class = MaterialsSerializer
	permission_classes = [CourseScopedContentPermission]

	def perform_create(self, serializer):
		if self.request.user.role != User.ROLE_ADMIN and serializer.validated_data["course_id"].teacher_id_id != self.request.user.id:
			raise PermissionDenied("You can only add materials to your own courses.")
		serializer.save()
