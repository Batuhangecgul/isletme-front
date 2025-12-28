import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Randevu {
  randevu_id: number;
  telefon: string;
  isletme_isim: string;
  calisan_ad: string;
  calisan_soyad: string;
  baslangic_zamani: string;
  bitis_zamani: string;
  randevu_durumu: string;
  // diğer alanlar
}

export interface RandevuSorgulaResponse {
  randevular?: Randevu[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SorulamaServisiService {
  private apiUrl = 'https://laravel-production-b9e5.up.railway.app/api/randevu-sorgula';

  constructor(private http: HttpClient) { }

  randevuSorgula(telefon: string): Observable<RandevuSorgulaResponse> {
    return this.http.get<RandevuSorgulaResponse>(`${this.apiUrl}?telefon=${telefon}`);
  }
}
