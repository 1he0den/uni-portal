import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api/api.config';
import { Material } from '../api/types';

export interface CreateMaterialRequest {
  title: string;
  file_url?: string | null;
  course_id: number;
}

export type UpdateMaterialRequest = Partial<CreateMaterialRequest>;

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);

  list(): Observable<Material[]> {
    return this.http.get<Material[]>(`${API_URL}/materials/`);
  }

  get(id: number): Observable<Material> {
    return this.http.get<Material>(`${API_URL}/materials/${id}/`);
  }

  create(data: CreateMaterialRequest): Observable<Material> {
    return this.http.post<Material>(`${API_URL}/materials/`, data);
  }

  update(id: number, data: CreateMaterialRequest): Observable<Material> {
    return this.http.put<Material>(`${API_URL}/materials/${id}/`, data);
  }

  patch(id: number, data: UpdateMaterialRequest): Observable<Material> {
    return this.http.patch<Material>(`${API_URL}/materials/${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/materials/${id}/`);
  }
}

