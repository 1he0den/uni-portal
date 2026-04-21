import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Dashboard } from './pages/dashboard/dashboard';
import { Courses } from './pages/courses/courses';
import { ProfileComponent } from './pages/profile/profile';
import {
  authGuard,
  guestGuard,
  adminGuard,
  teacherOrAdminGuard,
} from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'courses', component: Courses, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tasks/tasks').then((m) => m.TasksPage),
  },
  {
    path: 'submissions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/submissions/submissions').then((m) => m.SubmissionsPage),
  },
  {
    path: 'announcements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/announcements/announcements').then(
        (m) => m.AnnouncementsPage
      ),
  },
  {
    path: 'materials',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/materials/materials').then((m) => m.MaterialsPage),
  },
  {
    path: 'teacher/courses',
    canActivate: [authGuard, teacherOrAdminGuard],
    loadComponent: () =>
      import('./pages/teacher-courses/teacher-courses').then(
        (m) => m.TeacherCoursesPage
      ),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/admin-users/admin-users').then((m) => m.AdminUsers),
  },
  { path: '**', redirectTo: 'login' },
];