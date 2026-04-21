import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Enrollment } from '../models/enrollment.model';
import { API_URL } from '../api/api.config';
import { Course } from '../api/types';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) {}

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses/`);
  }

  createCourse(data: {
    name: string;
    description: string;
    credits: number;
  }): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/courses/`, data);
  }

  updateCourse(
    id: number,
    data: {
      name: string;
      description: string;
      credits: number;
    }
  ): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/courses/${id}/`, data);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/courses/${id}/`);
  }

  getEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.apiUrl}/enrollments/`);
  }

  createEnrollment(course_id: number): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.apiUrl}/enrollments/`, { course_id });
  }

  deleteEnrollment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/enrollments/${id}/`);
}
}