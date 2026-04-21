from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AnnouncementsViewSet,
    CourseViewSet,
    EnrollmentViewSet,
    MaterialsViewSet,
    ProfileAPIView,
    SubmissionsViewSet,
    TasksViewSet,
    TeacherCoursesAPIView,
    UserViewSet,
    login_view,
    logout_view,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("courses", CourseViewSet, basename="course")
router.register("enrollments", EnrollmentViewSet, basename="enrollment")
router.register("tasks", TasksViewSet, basename="task")
router.register("submissions", SubmissionsViewSet, basename="submission")
router.register("announcements", AnnouncementsViewSet, basename="announcement")
router.register("materials", MaterialsViewSet, basename="material")

urlpatterns = [
    path("auth/login/", login_view, name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", ProfileAPIView.as_view(), name="profile"),
    path("teachers/<int:user_id>/courses/", TeacherCoursesAPIView.as_view(), name="teacher-courses"),
    path("", include(router.urls)),
]
