import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService, CreateUserRequest } from '../../services/user';
import { AuthService } from '../../services/auth';
import { User, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly searchQuery = signal('');
  readonly roleFilter = signal<UserRole | 'all'>('all');

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const role = this.roleFilter();
    return this.users().filter((u) => {
      const matchesRole = role === 'all' || u.role === role;
      const matchesQuery =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  });

  readonly displayedColumns = ['id', 'username', 'email', 'full_name', 'role', 'actions'];

  readonly showCreateForm = signal(false);
  readonly creating = signal(false);

  newUser: CreateUserRequest = {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.detail || 'Не удалось загрузить пользователей'
        );
        this.loading.set(false);
      },
    });
  }

  toggleCreateForm(): void {
    if (this.showCreateForm()) {
      this.resetForm();
    } else {
      this.showCreateForm.set(true);
    }
  }

  createUser(): void {
    if (
      !this.newUser.username ||
      !this.newUser.email ||
      !this.newUser.password ||
      !this.newUser.first_name ||
      !this.newUser.last_name
    ) {
      this.snackBar.open('Заполни все поля', 'OK', { duration: 3000 });
      return;
    }

    this.creating.set(true);

    this.userService.createUser(this.newUser).subscribe({
      next: () => {
        this.creating.set(false);
        this.snackBar.open('Пользователь создан', 'OK', { duration: 3000 });
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => {
        this.creating.set(false);
        const msg = this.extractError(err) || 'Не удалось создать пользователя';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  deleteUser(user: User): void {
    const currentId = this.authService.currentUser()?.id;
    if (user.id === currentId) {
      this.snackBar.open('Нельзя удалить самого себя', 'OK', { duration: 3000 });
      return;
    }

    if (!confirm(`Удалить пользователя "${user.username}"?`)) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.snackBar.open('Пользователь удалён', 'OK', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        const msg = this.extractError(err) || 'Не удалось удалить';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  roleLabel(role: UserRole): string {
    switch (role) {
      case 'student':
        return 'Студент';
      case 'teacher':
        return 'Преподаватель';
      case 'admin':
        return 'Администратор';
    }
  }

  roleColor(role: UserRole): string {
    switch (role) {
      case 'student':
        return 'student';
      case 'teacher':
        return 'teacher';
      case 'admin':
        return 'admin';
    }
  }

  private resetForm(): void {
    this.showCreateForm.set(false);
    this.newUser = {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'student',
    };
  }

  private extractError(error: unknown): string {
    const err = error as { error?: Record<string, unknown> | string };
    const data = err?.error;
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data === 'object' && 'detail' in data) return String(data['detail']);
    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const [field, messages] = entries[0];
        const msg = Array.isArray(messages) ? messages[0] : messages;
        return `${field}: ${String(msg)}`;
      }
    }
    return '';
  }
}