import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api/api.config';
import { Submission } from '../api/types';

export interface CreateSubmissionRequest {
  task_id: number;
  file_url?: string | null;
}

export interface GradeSubmissionRequest {
  grade?: number | null;
  feedback?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SubmissionsService {
  private http = inject(HttpClient);

  list(): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${API_URL}/submissions/`);
  }

  get(id: number): Observable<Submission> {
    return this.http.get<Submission>(`${API_URL}/submissions/${id}/`);
  }

  create(data: CreateSubmissionRequest): Observable<Submission> {
    return this.http.post<Submission>(`${API_URL}/submissions/`, data);
  }

  patch(id: number, data: GradeSubmissionRequest): Observable<Submission> {
    return this.http.patch<Submission>(`${API_URL}/submissions/${id}/`, data);
  }

  update(id: number, data: GradeSubmissionRequest): Observable<Submission> {
    return this.http.put<Submission>(`${API_URL}/submissions/${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/submissions/${id}/`);
  }
}

