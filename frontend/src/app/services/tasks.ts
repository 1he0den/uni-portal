import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api/api.config';
import { Task } from '../api/types';

export interface CreateTaskRequest {
  name: string;
  description: string;
  deadline: string;
  course_id: number;
  max_points: number;
  file_url?: string | null;
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;

@Injectable({ providedIn: 'root' })
export class TasksService {
  private http = inject(HttpClient);

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API_URL}/tasks/`);
  }

  get(id: number): Observable<Task> {
    return this.http.get<Task>(`${API_URL}/tasks/${id}/`);
  }

  create(data: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${API_URL}/tasks/`, data);
  }

  update(id: number, data: CreateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${API_URL}/tasks/${id}/`, data);
  }

  patch(id: number, data: UpdateTaskRequest): Observable<Task> {
    return this.http.patch<Task>(`${API_URL}/tasks/${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/tasks/${id}/`);
  }
}

