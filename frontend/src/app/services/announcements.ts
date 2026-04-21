import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api/api.config';
import { Announcement } from '../api/types';

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  course_id: number;
}

export type UpdateAnnouncementRequest = Partial<CreateAnnouncementRequest>;

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private http = inject(HttpClient);

  list(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${API_URL}/announcements/`);
  }

  get(id: number): Observable<Announcement> {
    return this.http.get<Announcement>(`${API_URL}/announcements/${id}/`);
  }

  create(data: CreateAnnouncementRequest): Observable<Announcement> {
    return this.http.post<Announcement>(`${API_URL}/announcements/`, data);
  }

  update(id: number, data: CreateAnnouncementRequest): Observable<Announcement> {
    return this.http.put<Announcement>(`${API_URL}/announcements/${id}/`, data);
  }

  patch(id: number, data: UpdateAnnouncementRequest): Observable<Announcement> {
    return this.http.patch<Announcement>(`${API_URL}/announcements/${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/announcements/${id}/`);
  }
}

