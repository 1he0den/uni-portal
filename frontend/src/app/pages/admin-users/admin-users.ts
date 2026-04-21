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
import { extractApiErrorMessage } from '../../api/error';

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
  readonly editingUserId = signal<number | null>(null);
  readonly loadingUser = signal(false);

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
          extractApiErrorMessage(err) || 'Не удалось загрузить пользователей'
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

  startEdit(user: User): void {
    this.loadingUser.set(true);
    this.userService.getUser(user.id).subscribe({
      next: (full) => {
        this.loadingUser.set(false);
        this.editingUserId.set(full.id);
        this.showCreateForm.set(true);
        this.newUser = {
          username: full.username,
          email: full.email,
          password: '',
          first_name: full.first_name,
          last_name: full.last_name,
          role: full.role,
        };
      },
      error: (err) => {
        this.loadingUser.set(false);
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось загрузить пользователя', 'OK', {
          duration: 4500,
        });
      },
    });
  }

  createOrUpdateUserPatch(): void {
    const editingId = this.editingUserId();
    if (editingId !== null) return this.updateUserPatch(editingId);
    return this.createUser();
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
        const msg = extractApiErrorMessage(err) || 'Не удалось создать пользователя';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  updateUserPatch(id: number): void {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.first_name || !this.newUser.last_name) {
      this.snackBar.open('Заполни username, email, имя и фамилию', 'OK', { duration: 3000 });
      return;
    }

    this.creating.set(true);

    const payload: Partial<CreateUserRequest> & { password?: string } = {
      username: this.newUser.username,
      email: this.newUser.email,
      first_name: this.newUser.first_name,
      last_name: this.newUser.last_name,
      role: this.newUser.role,
    };
    if (this.newUser.password) payload.password = this.newUser.password;

    this.userService.patchUser(id, payload).subscribe({
      next: () => {
        this.creating.set(false);
        this.snackBar.open('Пользователь обновлён (PATCH)', 'OK', { duration: 3000 });
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => {
        this.creating.set(false);
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось обновить пользователя', 'OK', {
          duration: 4500,
        });
      },
    });
  }

  updateUserPut(id: number): void {
    if (
      !this.newUser.username ||
      !this.newUser.email ||
      !this.newUser.password ||
      !this.newUser.first_name ||
      !this.newUser.last_name
    ) {
      this.snackBar.open('Для PUT заполни все поля, включая пароль', 'OK', { duration: 3500 });
      return;
    }

    this.creating.set(true);
    this.userService.updateUser(id, this.newUser).subscribe({
      next: () => {
        this.creating.set(false);
        this.snackBar.open('Пользователь обновлён (PUT)', 'OK', { duration: 3000 });
        this.resetForm();
        this.loadUsers();
      },
      error: (err) => {
        this.creating.set(false);
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось обновить пользователя', 'OK', {
          duration: 4500,
        });
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
        const msg = extractApiErrorMessage(err) || 'Не удалось удалить';
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
    this.editingUserId.set(null);
    this.newUser = {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'student',
    };
  }

  // NOTE: error extraction is centralized in ../../api/error
}