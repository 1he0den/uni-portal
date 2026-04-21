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
import { MaterialsService, CreateMaterialRequest } from '../../services/materials';
import { Course, Material } from '../../api/types';
import { extractApiErrorMessage } from '../../api/error';
import { DateTimePipe } from '../../pipes/datetime.pipe';

@Component({
  selector: 'app-materials',
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
  templateUrl: './materials.html',
  styleUrl: './materials.scss',
})
export class MaterialsPage implements OnInit {
  private auth = inject(AuthService);
  private courseService = inject(CourseService);
  private materialsService = inject(MaterialsService);
  private snackBar = inject(MatSnackBar);

  readonly role = this.auth.role;

  readonly materials = signal<Material[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  form: CreateMaterialRequest = {
    title: '',
    file_url: null,
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

    this.materialsService.list().subscribe({
      next: (items) => {
        this.materials.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(extractApiErrorMessage(err) || 'Не удалось загрузить materials');
        this.loading.set(false);
      },
    });
  }

  toggleForm(): void {
    if (!this.canEdit()) return;
    if (this.showForm()) this.resetForm();
    else this.showForm.set(true);
  }

  startEdit(m: Material): void {
    if (!this.canEdit()) return;
    this.editingId.set(m.id);
    this.showForm.set(true);
    this.form = { title: m.title, file_url: m.file_url, course_id: m.course_id };
  }

  submit(): void {
    if (!this.canEdit()) return;
    if (!this.form.title || !this.form.course_id) {
      this.snackBar.open('Заполни название и курс', 'OK', { duration: 3500 });
      return;
    }

    this.saving.set(true);
    const id = this.editingId();
    const req$ =
      id !== null ? this.materialsService.update(id, this.form) : this.materialsService.create(this.form);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(id !== null ? 'Материал обновлён' : 'Материал добавлен', 'OK', {
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
    if (!confirm('Удалить материал?')) return;

    this.materialsService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Материал удалён', 'OK', { duration: 3000 });
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
    this.form = { title: '', file_url: null, course_id: 0 };
  }

  // NOTE: error extraction is centralized in ../../api/error
}

