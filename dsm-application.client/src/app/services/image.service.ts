import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

    constructor(private api: ApiService) {}

  // 👉 Upload AVIF image (or any file)
  upload(file: File): Observable<{ id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post<{ id: string }>('images/upload', formData);
  }

  // 👉 Get image by ID (GridFS)
  getImageUrl(id: string): string {
    return `/api/images/${id}`;
  }

  // 👉 Optional: Delete image
  deleteImage(id: string): Observable<any> {
    return this.api.delete(`images/${id}`);
  }
}
