# University Portal

## 📌 About

University Portal is a simple web application for students.
It helps manage schedule, subjects, and tasks.

This project uses Angular (frontend) and Django REST Framework (backend).

---

## Team

* Sabyrov Rustem
* Abu Nurbol
* Akhmetshiev Arman

---

## Technologies

Frontend:

* Angular

Backend:

* Django
* Django REST Framework

Other:

* SQLite
* JWT Authentication

---

## Features

* View and manage schedule
* Add and edit subjects
* Create, update, delete tasks
* User authentication (login/logout)

---

## Frontend (Angular)

* Routing with 3+ pages
* Forms with ngModel
* API requests using HttpClient
* JWT interceptor
* Error handling

---

## Backend (Django API)

### Models

* User
* Subject
* Task
* Schedule

### API Endpoints

* POST /api/login/

* POST /api/logout/

* GET /api/subjects/

* POST /api/subjects/

* GET /api/tasks/

* POST /api/tasks/

* PUT /api/tasks/{id}/

* DELETE /api/tasks/{id}/

---

## Authentication

JWT authentication is used.
Users must log in to access the API.

---

## How to run

### Backend (Django)

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (Angular)

```bash
cd frontend
npm install
ng serve
```

---

## Postman

Postman collection is included in the repository.
It contains all API requests and example responses.

---

## Notes

* All API requests are connected to Angular frontend
* CRUD operations are implemented
* Each object is linked to the authenticated user

---

## Project Info

This project was created for Web Development course (KBTU).
It demonstrates REST API, Angular frontend, and Django backend integration.
