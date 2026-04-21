# Uni Portal

Учебный портал с backend API и Angular frontend.

## Структура
- `backend/`: Django REST Framework API (JWT auth)
- `frontend/`: Angular (Material UI)

## Требования
- Node.js + npm
- Python 3.x

## Запуск backend (Django)
Команды зависят от того, как у вас настроено окружение (venv/poetry и т.п.).
Базово:

1. Перейдите в `backend/`
2. Установите зависимости (по вашему способу)
3. Запустите сервер разработки Django

По умолчанию backend доступен на:
- `http://127.0.0.1:8000`
- API префикс: `/api/`

## Запуск frontend (Angular)

```bash
cd frontend
npm install
npm start
```

Frontend по умолчанию:
- `http://localhost:4200`

## Авторизация
Используется JWT:
- `POST /api/auth/login/` → `access`, `refresh`
- `POST /api/auth/refresh/` → новый `access`
- `POST /api/auth/logout/` → blacklist refresh token
- `GET /api/profile/` → данные текущего пользователя

Токены хранятся в `localStorage`, запросы подписываются через HTTP interceptor.

## Роли
- `student`
- `teacher`
- `admin`

Права зависят от роли и владения курсом (teacher редактирует только свои курсы и связанные сущности).

## Документация API
- Контракт и список эндпоинтов: `FRONTEND_API_HANDOFF.md`
- Чек-лист ручной проверки вызовов из UI: `FRONTEND_API_CHECKLIST.md`
- Postman коллекция: `backend/postman_collection.json`

