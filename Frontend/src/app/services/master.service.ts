import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/master`;

  // --- Countries ---
  getCountries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/countries`);
  }

  addCountry(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/countries`, data);
  }

  updateCountry(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/countries/${id}`, data);
  }

  deleteCountry(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/countries/${id}`);
  }

  // --- Cities ---
  getCities(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cities`);
  }

  addCity(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cities`, data);
  }

  updateCity(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/cities/${id}`, data);
  }

  deleteCity(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/cities/${id}`);
  }
}
