import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CourseService } from '../../services/course';
import { AuthService } from '../../services/auth';
import { Enrollment } from '../../models/enrollment.model';
import { extractApiErrorMessage } from '../../api/error';
import { Course } from '../../api/types';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './courses.html',
  styleUrl: './courses.scss',
})
export class Courses implements OnInit {
  private courseService = inject(CourseService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  readonly courses = signal<Course[]>([]);
  readonly enrollments = signal<Enrollment[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly role = this.authService.role;
  readonly currentUserId = computed(
    () => this.authService.currentUser()?.id ?? null
  );

  // Множество ID курсов, на которые записан ТЕКУЩИЙ юзер
  readonly enrolledCourseIds = computed(() => {
    const uid = this.currentUserId();
    if (uid === null) return new Set<number>();
    return new Set(
      this.enrollments()
        .filter((e) => e.student_id === uid)
        .map((e) => e.course_id)
    );
  });

  readonly enrolledCourses = computed(() =>
    this.courses().filter((c) => this.enrolledCourseIds().has(c.id))
  );

  readonly availableCourses = computed(() =>
    this.courses().filter((c) => !this.enrolledCourseIds().has(c.id))
  );

  // Для препода — только свои курсы
  readonly myCreatedCourses = computed(() => {
    const uid = this.currentUserId();
    if (uid === null) return [];
    return this.courses().filter((c) => c.teacher_id === uid);
  });

  // Форма создания/редактирования
  readonly creating = signal(false);
  readonly showCreateForm = signal(false);
  readonly editingCourseId = signal<number | null>(null);

  newCourse = {
    name: '',
    description: '',
    credits: 0,
  };

  // Какие курсы сейчас в процессе enroll (для спиннера на кнопке)
  readonly enrollingCourseIds = signal(new Set<number>());

  ngOnInit(): void {
    this.loadAll();

    // Если пришли с /courses#create — раскрываем форму
    this.route.fragment.subscribe((fragment) => {
      if (
        fragment === 'create' &&
        (this.role() === 'teacher' || this.role() === 'admin')
      ) {
        this.showCreateForm.set(true);
      }
    });
  }

  loadAll(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        if (this.role() === 'student') {
          this.reloadEnrollments(() => this.loading.set(false));
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.errorMessage.set(
          extractApiErrorMessage(err) || 'Не удалось загрузить курсы'
        );
        this.loading.set(false);
      },
    });
  }

  private reloadEnrollments(done?: () => void): void {
    this.courseService.getEnrollments().subscribe({
      next: (e) => {
        this.enrollments.set(e);
        done?.();
      },
      error: () => done?.(),
    });
  }

  isEnrolling(courseId: number): boolean {
    return this.enrollingCourseIds().has(courseId);
  }

  enroll(courseId: number): void {
    if (this.isEnrolling(courseId)) return;

    this.enrollingCourseIds.update((set) => new Set(set).add(courseId));

    this.courseService.createEnrollment(courseId).subscribe({
      next: () => {
        this.removeEnrolling(courseId);
        this.snackBar.open('Вы записаны на курс', 'OK', { duration: 3000 });
        this.reloadEnrollments();
      },
      error: (err) => {
        this.removeEnrolling(courseId);
        const msg = extractApiErrorMessage(err) || 'Не удалось записаться на курс';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  unenroll(courseId: number): void {
    const uid = this.currentUserId();
    const enrollment = this.enrollments().find(
      (e) => e.course_id === courseId && e.student_id === uid
    );
    if (!enrollment) return;
    if (!confirm('Отписаться от этого курса?')) return;

    this.courseService.deleteEnrollment(enrollment.id).subscribe({
      next: () => {
        this.snackBar.open('Вы отписались от курса', 'OK', { duration: 3000 });
        this.reloadEnrollments();
      },
      error: (err) => {
        const msg = extractApiErrorMessage(err) || 'Не удалось отписаться';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  private removeEnrolling(courseId: number): void {
    this.enrollingCourseIds.update((set) => {
      const copy = new Set(set);
      copy.delete(courseId);
      return copy;
    });
  }

  createOrUpdateCourse(): void {
    if (!this.newCourse.name || !this.newCourse.description) {
      this.snackBar.open('Заполни название и описание', 'OK', {
        duration: 3000,
      });
      return;
    }

    this.creating.set(true);
    const editingId = this.editingCourseId();

    const request$ =
      editingId !== null
        ? this.courseService.updateCourse(editingId, this.newCourse)
        : this.courseService.createCourse(this.newCourse);

    request$.subscribe({
      next: () => {
        this.creating.set(false);
        this.snackBar.open(
          editingId !== null ? 'Курс обновлён' : 'Курс создан',
          'OK',
          { duration: 3000 }
        );
        this.resetForm();
        this.loadAll();
      },
      error: (err) => {
        this.creating.set(false);
        const msg = extractApiErrorMessage(err) || 'Ошибка сохранения';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  startEdit(course: Course): void {
    this.editingCourseId.set(course.id);
    this.showCreateForm.set(true);
    this.newCourse = {
      name: course.name,
      description: course.description,
      credits: course.credits,
    };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteCourse(courseId: number): void {
    if (!confirm('Удалить этот курс?')) return;

    this.courseService.deleteCourse(courseId).subscribe({
      next: () => {
        this.snackBar.open('Курс удалён', 'OK', { duration: 3000 });
        if (this.editingCourseId() === courseId) this.resetForm();
        this.loadAll();
      },
      error: (err) => {
        const msg = extractApiErrorMessage(err) || 'Не удалось удалить курс';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
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

  private resetForm(): void {
    this.editingCourseId.set(null);
    this.showCreateForm.set(false);
    this.newCourse = { name: '', description: '', credits: 0 };
  }

  // NOTE: error extraction is centralized in ../../api/error
}