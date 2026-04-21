import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth';
import { CourseService } from '../../services/course';
import { TasksService, CreateTaskRequest } from '../../services/tasks';
import { Course, Task } from '../../api/types';
import { extractApiErrorMessage } from '../../api/error';
import { DateTimePipe } from '../../pipes/datetime.pipe';

@Component({
  selector: 'app-tasks',
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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DateTimePipe,
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss',
})
export class TasksPage implements OnInit {
  private auth = inject(AuthService);
  private tasksService = inject(TasksService);
  private courseService = inject(CourseService);
  private snackBar = inject(MatSnackBar);

  readonly role = this.auth.role;
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);

  readonly yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i);
  readonly monthOptions = [
    { value: 1, label: 'Январь' },
    { value: 2, label: 'Февраль' },
    { value: 3, label: 'Март' },
    { value: 4, label: 'Апрель' },
    { value: 5, label: 'Май' },
    { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' },
    { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябрь' },
    { value: 10, label: 'Октябрь' },
    { value: 11, label: 'Ноябрь' },
    { value: 12, label: 'Декабрь' },
  ] as const;

  readonly deadlineYear = signal<number | null>(null);
  readonly deadlineMonth = signal<number | null>(null); // 1..12
  readonly deadlineDay = signal<number | null>(null); // 1..31

  readonly dayOptions = computed(() => {
    const y = this.deadlineYear();
    const m = this.deadlineMonth();
    if (!y || !m) return Array.from({ length: 31 }, (_, i) => i + 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  });

  readonly tasks = signal<Task[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  form: CreateTaskRequest = {
    name: '',
    description: '',
    deadline: '',
    course_id: 0,
    max_points: 0,
    file_url: null,
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses().subscribe({
      next: (courses) => this.courses.set(courses),
      error: () => this.courses.set([]),
    });

    this.tasksService.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(extractApiErrorMessage(err) || 'Не удалось загрузить задания');
        this.loading.set(false);
      },
    });
  }

  canEdit(): boolean {
    return this.role() === 'teacher' || this.role() === 'admin';
  }

  toggleForm(): void {
    if (!this.canEdit()) return;
    if (this.showForm()) {
      this.resetForm();
    } else {
      this.showForm.set(true);
    }
  }

  startEdit(task: Task): void {
    if (!this.canEdit()) return;
    this.editingId.set(task.id);
    this.showForm.set(true);
    this.setDeadlinePartsFromIso(task.deadline);
    this.form = {
      name: task.name,
      description: task.description,
      deadline: task.deadline,
      course_id: task.course_id,
      max_points: task.max_points,
      file_url: task.file_url,
    };
  }

  onDeadlinePartsChange(): void {
    const y = this.deadlineYear();
    const m = this.deadlineMonth();
    const d = this.deadlineDay();
    if (!y || !m || !d) {
      this.form.deadline = '';
      return;
    }

    // Backend expects datetime string; we use end-of-day UTC for chosen date.
    this.form.deadline = `${this.pad4(y)}-${this.pad2(m)}-${this.pad2(d)}T23:59:59Z`;
  }

  submit(): void {
    if (!this.canEdit()) return;
    if (!this.form.name || !this.form.description || !this.form.deadline || !this.form.course_id) {
      this.snackBar.open('Заполни название, описание, дедлайн и курс', 'OK', {
        duration: 3500,
      });
      return;
    }

    this.saving.set(true);
    const id = this.editingId();

    const req$ =
      id !== null ? this.tasksService.update(id, this.form) : this.tasksService.create(this.form);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(id !== null ? 'Задание обновлено' : 'Задание создано', 'OK', {
          duration: 3000,
        });
        this.resetForm();
        this.loadAll();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось сохранить задание', 'OK', {
          duration: 4500,
        });
      },
    });
  }

  delete(id: number): void {
    if (!this.canEdit()) return;
    if (!confirm('Удалить это задание?')) return;

    this.tasksService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Задание удалено', 'OK', { duration: 3000 });
        if (this.editingId() === id) this.resetForm();
        this.loadAll();
      },
      error: (err) => {
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось удалить', 'OK', {
          duration: 4500,
        });
      },
    });
  }

  private resetForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.deadlineYear.set(null);
    this.deadlineMonth.set(null);
    this.deadlineDay.set(null);
    this.form = {
      name: '',
      description: '',
      deadline: '',
      course_id: 0,
      max_points: 0,
      file_url: null,
    };
  }

  private setDeadlinePartsFromIso(iso: string): void {
    const datePart = iso?.split('T')?.[0] ?? '';
    const [yStr, mStr, dStr] = datePart.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    if (!y || !m || !d) {
      this.deadlineYear.set(null);
      this.deadlineMonth.set(null);
      this.deadlineDay.set(null);
      return;
    }
    this.deadlineYear.set(y);
    this.deadlineMonth.set(m);
    this.deadlineDay.set(d);
    this.onDeadlinePartsChange();
  }

  private pad2(n: number): string {
    return String(n).padStart(2, '0');
  }

  private pad4(n: number): string {
    return String(n).padStart(4, '0');
  }

  // NOTE: error extraction is centralized in ../../api/error
}

