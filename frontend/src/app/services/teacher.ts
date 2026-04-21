import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api/api.config';
import { Course } from '../api/types';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private http = inject(HttpClient);

  getCoursesByTeacher(userId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${API_URL}/teachers/${userId}/courses/`);
  }
}

