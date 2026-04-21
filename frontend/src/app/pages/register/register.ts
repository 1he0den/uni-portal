import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserRole } from '../../models/user.model';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
  CommonModule,
  FormsModule,
  RouterLink,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatButtonModule,
  MatIconModule,
  MatSelectModule,
],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  email = '';
  password = '';
  firstName = '';
  lastName = '';
  role: Extract<UserRole, 'student' | 'teacher'> = 'student';

  errorMessage = '';
  loading = false;

  onSubmit(): void {
    if (
      !this.username ||
      !this.email ||
      !this.password ||
      !this.firstName ||
      !this.lastName
    ) {
      this.errorMessage = 'Заполни все поля';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    this.authService
      .registerAndLogin({
        username: this.username,
        email: this.email,
        password: this.password,
        first_name: this.firstName,
        last_name: this.lastName,
        role: this.role,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = this.extractError(error);
        },
      });
  }

  private extractError(error: unknown): string {
    const err = error as { error?: Record<string, unknown> | string };
    const data = err?.error;

    if (typeof data === 'string') {
      return data;
    }
    if (data && typeof data === 'object') {
      const entries = Object.entries(data);
      if (entries.length > 0) {
        const [field, messages] = entries[0];
        const msg = Array.isArray(messages) ? messages[0] : messages;
        return `${field}: ${String(msg)}`;
      }
    }
    return 'Ошибка регистрации';
  }
}