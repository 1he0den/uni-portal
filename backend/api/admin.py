from django.contrib import admin
from .models import User, Course, Enrollment, Tasks, Submissions, Announcements, Materials


admin.site.register(User)
admin.site.register(Course)
admin.site.register(Enrollment)
admin.site.register(Tasks)
admin.site.register(Submissions)
admin.site.register(Announcements)
admin.site.register(Materials)
