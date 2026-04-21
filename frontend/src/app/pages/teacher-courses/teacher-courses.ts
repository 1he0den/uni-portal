import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth';
import { TeacherService } from '../../services/teacher';
import { Course } from '../../api/types';
import { extractApiErrorMessage } from '../../api/error';

@Component({
  selector: 'app-teacher-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './teacher-courses.html',
  styleUrl: './teacher-courses.scss',
})
export class TeacherCoursesPage implements OnInit {
  private auth = inject(AuthService);
  private teacherService = inject(TeacherService);
  private snackBar = inject(MatSnackBar);

  readonly role = this.auth.role;
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);

  readonly courses = signal<Course[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  teacherIdInput = 0;

  ngOnInit(): void {
    const uid = this.currentUserId();
    if (uid) this.teacherIdInput = uid;
    this.load();
  }

  canUseEndpoint(): boolean {
    return this.role() === 'teacher' || this.role() === 'admin';
  }

  load(): void {
    if (!this.canUseEndpoint()) return;

    const uid = this.role() === 'teacher' ? this.currentUserId() : this.teacherIdInput;
    if (!uid) {
      this.snackBar.open('Не указан teacher_id', 'OK', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.teacherService.getCoursesByTeacher(uid).subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          extractApiErrorMessage(err) || 'Не удалось загрузить курсы преподавателя'
        );
        this.loading.set(false);
      },
    });
  }
  // NOTE: error extraction is centralized in ../../api/error
}

