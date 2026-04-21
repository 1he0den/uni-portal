import { Component, OnInit, inject, signal } from '@angular/core';
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
import { AnnouncementsService, CreateAnnouncementRequest } from '../../services/announcements';
import { Announcement, Course } from '../../api/types';
import { extractApiErrorMessage } from '../../api/error';
import { DateTimePipe } from '../../pipes/datetime.pipe';

@Component({
  selector: 'app-announcements',
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
  templateUrl: './announcements.html',
  styleUrl: './announcements.scss',
})
export class AnnouncementsPage implements OnInit {
  private auth = inject(AuthService);
  private courseService = inject(CourseService);
  private announcementsService = inject(AnnouncementsService);
  private snackBar = inject(MatSnackBar);

  readonly role = this.auth.role;

  readonly announcements = signal<Announcement[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  form: CreateAnnouncementRequest = {
    title: '',
    content: '',
    course_id: 0,
  };

  ngOnInit(): void {
    this.loadAll();
  }

  canEdit(): boolean {
    return this.role() === 'teacher' || this.role() === 'admin';
  }

  loadAll(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses().subscribe({
      next: (courses) => this.courses.set(courses),
      error: () => this.courses.set([]),
    });

    this.announcementsService.list().subscribe({
      next: (items) => {
        this.announcements.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(extractApiErrorMessage(err) || 'Не удалось загрузить announcements');
        this.loading.set(false);
      },
    });
  }

  toggleForm(): void {
    if (!this.canEdit()) return;
    if (this.showForm()) this.resetForm();
    else this.showForm.set(true);
  }

  startEdit(a: Announcement): void {
    if (!this.canEdit()) return;
    this.editingId.set(a.id);
    this.showForm.set(true);
    this.form = { title: a.title, content: a.content, course_id: a.course_id };
  }

  submit(): void {
    if (!this.canEdit()) return;
    if (!this.form.title || !this.form.content || !this.form.course_id) {
      this.snackBar.open('Заполни заголовок, текст и курс', 'OK', { duration: 3500 });
      return;
    }

    this.saving.set(true);
    const id = this.editingId();
    const req$ =
      id !== null ? this.announcementsService.update(id, this.form) : this.announcementsService.create(this.form);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(id !== null ? 'Объявление обновлено' : 'Объявление создано', 'OK', {
          duration: 3000,
        });
        this.resetForm();
        this.loadAll();
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(extractApiErrorMessage(err) || 'Не удалось сохранить', 'OK', {
          duration: 4500,
        });
      },
    });
  }

  delete(id: number): void {
    if (!this.canEdit()) return;
    if (!confirm('Удалить объявление?')) return;

    this.announcementsService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Объявление удалено', 'OK', { duration: 3000 });
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

  courseLabel(courseId: number): string {
    const c = this.courses().find((x) => x.id === courseId);
    return c ? c.name : `Course ID: ${courseId}`;
  }

  private resetForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form = { title: '', content: '', course_id: 0 };
  }

  // NOTE: error extraction is centralized in ../../api/error
}

