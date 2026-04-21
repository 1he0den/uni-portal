import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth';
import { TasksService } from '../../services/tasks';
import { SubmissionsService, CreateSubmissionRequest, GradeSubmissionRequest } from '../../services/submissions';
import { Submission, Task } from '../../api/types';
import { extractApiErrorMessage } from '../../api/error';
import { DateTimePipe } from '../../pipes/datetime.pipe';

@Component({
  selector: 'app-submissions',
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
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DateTimePipe,
  ],
  templateUrl: './submissions.html',
  styleUrl: './submissions.scss',
})
export class SubmissionsPage implements OnInit {
  private auth = inject(AuthService);
  private tasksService = inject(TasksService);
  private submissionsService = inject(SubmissionsService);
  private snackBar = inject(MatSnackBar);

  readonly role = this.auth.role;
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);

  readonly tasks = signal<Task[]>([]);
  readonly submissions = signal<Submission[]>([]);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly submitting = signal(false);
  submitForm: CreateSubmissionRequest = { task_id: 0, file_url: null };

  readonly gradingId = signal<number | null>(null);
  readonly grading = signal(false);
  gradeForm: GradeSubmissionRequest = { grade: null, feedback: null };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.tasksService.list().subscribe({
      next: (tasks) => this.tasks.set(tasks),
      error: () => this.tasks.set([]),
    });

    this.submissionsService.list().subscribe({
      next: (subs) => {
        this.submissions.set(subs);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(extractApiErrorMessage(err) || 'Не удалось загрузить submissions');
        this.loading.set(false);
      },
    });
  }

  canSubmit(): boolean {
    return this.role() === 'student' || this.role() === 'admin';
  }

  canGrade(): boolean {
    return this.role() === 'teacher' || this.role() === 'admin';
  }

  submit(): void {
    if (!this.canSubmit()) return;
    if (!this.submitForm.task_id) {
      this.snackBar.open('Выбери задание', 'OK', { duration: 3000 });
      return;
    }

    this.submitting.set(true);
    this.submissionsService.create(this.submitForm).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open('Работа отправлена', 'OK', { duration: 3000 });
        this.submitForm = { task_id: 0, file_url: null };
        this.loadAll();
      },
      error: (err) => {
        this.submitting.set(false);
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось отправить работу', 'OK', {
          duration: 4500,
        });
      },
    });
  }

  startGrade(sub: Submission): void {
    if (!this.canGrade()) return;
    this.gradingId.set(sub.id);
    this.gradeForm = { grade: sub.grade, feedback: sub.feedback };
  }

  cancelGrade(): void {
    this.gradingId.set(null);
    this.gradeForm = { grade: null, feedback: null };
  }

  saveGrade(): void {
    const id = this.gradingId();
    if (!this.canGrade() || id === null) return;

    this.grading.set(true);
    this.submissionsService.patch(id, this.gradeForm).subscribe({
      next: () => {
        this.grading.set(false);
        this.snackBar.open('Оценка сохранена', 'OK', { duration: 3000 });
        this.cancelGrade();
        this.loadAll();
      },
      error: (err) => {
        this.grading.set(false);
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось сохранить оценку', 'OK', {
          duration: 4500,
        });
      },
    });
  }

  delete(id: number): void {
    if (!(this.role() === 'student' || this.role() === 'admin')) return;
    if (!confirm('Удалить эту отправку?')) return;

    this.submissionsService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Отправка удалена', 'OK', { duration: 3000 });
        this.loadAll();
      },
      error: (err) => {
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось удалить', 'OK', {
          duration: 4500,
        });
      },
    });
  }

  taskLabel(taskId: number): string {
    const task = this.tasks().find((t) => t.id === taskId);
    return task ? `${task.name} (ID: ${task.id})` : `Task ID: ${taskId}`;
  }

  // NOTE: error extraction is centralized in ../../api/error
}

