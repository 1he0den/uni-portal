import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  link: string;
  fragment?: string;
  color?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private authService = inject(AuthService);

  readonly user = this.authService.currentUser;

  readonly roleLabel = computed(() => {
    switch (this.authService.role()) {
      case 'student':
        return 'Студент';
      case 'teacher':
        return 'Преподаватель';
      case 'admin':
        return 'Администратор';
      default:
        return '';
    }
  });

  readonly quickActions = computed<QuickAction[]>(() => {
    const role = this.authService.role();

    if (role === 'student') {
      return [
        {
          title: 'Мои курсы',
          description: 'Просмотр и запись на курсы',
          icon: 'school',
          link: '/courses',
        },
        {
          title: 'Мой профиль',
          description: 'Личные данные и настройки',
          icon: 'person',
          link: '/profile',
        },
      ];
    }

    if (role === 'teacher') {
      return [
        {
          title: 'Мои курсы',
          description: 'Управление курсами и заданиями',
          icon: 'school',
          link: '/courses',
        },
        {
          title: 'Создать курс',
          description: 'Добавить новый курс',
          icon: 'add_circle',
          link: '/courses',
          fragment: 'create',
        },
        {
          title: 'Мой профиль',
          description: 'Личные данные и настройки',
          icon: 'person',
          link: '/profile',
        },
      ];
    }

    if (role === 'admin') {
      return [
        {
          title: 'Пользователи',
          description: 'Управление юзерами системы',
          icon: 'group',
          link: '/admin/users',
        },
        {
          title: 'Все курсы',
          description: 'Управление всеми курсами',
          icon: 'school',
          link: '/courses',
        },
        {
          title: 'Мой профиль',
          description: 'Личные данные',
          icon: 'person',
          link: '/profile',
        },
      ];
    }

    return [];
  });
}