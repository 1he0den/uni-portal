# Frontend Handoff: API Contract for Uni Portal

This file is for the frontend team.
It describes the backend API that is currently implemented and ready to use.

## 1) Environment

- Base backend URL: http://127.0.0.1:8000
- API prefix: /api/
- CORS allowed origins:
  - http://localhost:4200
  - http://127.0.0.1:4200

## 2) Authentication (JWT)

### Login
- Method: POST
- URL: /api/auth/login/
- Public: Yes
- Body:

{
  "username": "teacher1",
  "password": "StrongPass123!"
}

- Success response:

{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}

### Refresh Access Token
- Method: POST
- URL: /api/auth/refresh/
- Public: Yes (requires refresh token)
- Body:

{
  "refresh": "<jwt_refresh_token>"
}

### Logout
- Method: POST
- URL: /api/auth/logout/
- Auth required: Yes
- Body:

{
  "refresh": "<jwt_refresh_token>"
}

- Behavior: refresh token is blacklisted.

### Auth Header
For all protected endpoints, send:
- Authorization: Bearer <access_token>

## 3) Roles

User role values:
- student
- teacher
- admin

Important access rules:
- Only teacher/admin can create courses and tasks.
- Student creates enrollments and submissions.
- On create, backend auto-links ownership:
  - Course.teacher_id = current user
  - Enrollment.student_id = current user
  - Submission.student_id = current user
- Teachers can only modify content of their own courses.

## 4) Main Endpoints

## Users
- GET /api/users/ (admin only)
- POST /api/users/ (public registration)
- GET /api/users/{id}/ (self or admin)
- PUT/PATCH /api/users/{id}/ (self or admin)
- DELETE /api/users/{id}/ (admin only)

User payload fields:
- id
- username
- email
- password (write only)
- first_name
- last_name
- role

## Profile
- GET /api/profile/ (authenticated)

## Teacher Courses (extra APIView)
- GET /api/teachers/{user_id}/courses/
- Allowed for admin or the same teacher user_id.

## Courses (full CRUD)
- GET /api/courses/
- POST /api/courses/ (teacher/admin)
- GET /api/courses/{id}/
- PUT/PATCH /api/courses/{id}/ (owner teacher/admin)
- DELETE /api/courses/{id}/ (owner teacher/admin)

Course fields:
- id
- name
- description
- teacher_id (read only)
- credits
- created_at

## Enrollments
- GET /api/enrollments/
- POST /api/enrollments/ (student/admin)
- GET /api/enrollments/{id}/
- DELETE /api/enrollments/{id}/

Enrollment fields:
- id
- student_id (read only)
- course_id
- enrolled_at

## Tasks
- GET /api/tasks/
- POST /api/tasks/ (teacher/admin)
- GET /api/tasks/{id}/
- PUT/PATCH /api/tasks/{id}/ (owner teacher/admin)
- DELETE /api/tasks/{id}/ (owner teacher/admin)

Task fields:
- id
- name
- description
- deadline
- course_id
- max_points
- file_url
- created_at

## Submissions
- GET /api/submissions/
- POST /api/submissions/ (student/admin)
- GET /api/submissions/{id}/
- PUT/PATCH /api/submissions/{id}/ (teacher/admin for grading flows)
- DELETE /api/submissions/{id}/

Submission fields:
- id
- task_id
- student_id (read only)
- file_url
- submitted_at
- is_late (read only)
- grade
- feedback

Note: is_late is calculated automatically on create.

## Announcements
- GET /api/announcements/
- POST /api/announcements/ (teacher/admin)
- GET /api/announcements/{id}/
- PUT/PATCH /api/announcements/{id}/ (owner teacher/admin)
- DELETE /api/announcements/{id}/ (owner teacher/admin)

Announcement fields:
- id
- title
- content
- course_id
- created_at

## Materials
- GET /api/materials/
- POST /api/materials/ (teacher/admin)
- GET /api/materials/{id}/
- PUT/PATCH /api/materials/{id}/ (owner teacher/admin)
- DELETE /api/materials/{id}/ (owner teacher/admin)

Material fields:
- id
- title
- file_url
- course_id
- uploaded_at

## 5) Frontend Integration Notes (Angular)

1. Create one AuthService for login, refresh, logout.
2. Store access and refresh tokens (localStorage or sessionStorage).
3. Add HTTP interceptor:
   - attach Authorization Bearer token
   - on 401, call refresh endpoint once, retry original request
4. Build role-aware UI:
   - student pages: enroll, submit task
   - teacher pages: create courses/tasks/materials/announcements, view submissions
   - admin pages: manage users and all resources
5. Show backend detail messages from response errors.

## 6) Typical Error Cases To Handle

- 400 Bad Request: invalid payload
- 401 Unauthorized: token missing/expired
- 403 Forbidden: role/ownership restriction
- 404 Not Found: wrong resource id

## 7) Ready Postman File

A prepared collection exists at:
- backend/postman_collection.json

Use it to verify endpoint behavior quickly before wiring UI.
