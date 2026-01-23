import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Isletme {
  id: number;
  isletme_id?: number;
  ad?: string;
  isim?: string;
  kategori?: string;
  adres?: string;
  telefon?: string;
  puan?: number;
  resim?: string;
  fotograf?: string;
  zaman_artisi?: number;
  calisanlar?: Calisan[];
}

export interface Calisan {
  id: number;
  isletme_id: number;
  ad: string;
  soyad: string;
  email?: string;
  baslangic_saati: string;
  bitis_saati: string;
  uzmanlik?: string;
}

export interface Randevu {
  id?: number;
  randevu_id?: number;
  isletme_id: number;
  calisan_id: number;
  telefon: string;
  alan_kisi?: string;
  tarih?: string;
  saat?: string;
  baslangic_zamani?: string;
  bitis_zamani?: string;
  durum: string;
  calisan?: Calisan;
  yapilacak_islem?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IsletmeService {

  private apiUrl = 'https://laravel-production-b9e5.up.railway.app/api';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // ==================== MÜŞTERİ AKIŞI ====================

  // 1. İşletme listesi
  getIsletmeler(): Observable<Isletme[]> {
    return this.http.get<Isletme[]>(`${this.apiUrl}/isletmeler`, { headers: this.headers });
  }

  // 2. Seçilen işletme + çalışanları
  getIsletme(id: number): Observable<Isletme> {
    return this.http.get<Isletme>(`${this.apiUrl}/isletmeler/${id}`, { headers: this.headers });
  }

  // 3. Dolu slotları getir
  getDoluSlotlar(calisanId: number, tarih: string): Observable<Randevu[]> {
    let params = new HttpParams();
    params = params.set('calisan_id', calisanId.toString());
    params = params.set('tarih', tarih);
    return this.http.get<Randevu[]>(`${this.apiUrl}/randevular`, { headers: this.headers, params });
  }

  // 4. Randevu al (durum: false)
  randevuAl(randevu: Partial<Randevu>): Observable<Randevu> {
    return this.http.post<Randevu>(`${this.apiUrl}/randevular`, randevu, { headers: this.headers });
  }

  // ==================== İŞLETME PANELİ AKIŞI ====================

  // Randevu onayla (durum: true)
  randevuOnayla(randevuId: number): Observable<Randevu> {
    return this.http.patch<Randevu>(`${this.apiUrl}/randevular/${randevuId}`, { durum: true }, { headers: this.headers });
  }

  // Randevu reddet/sil
  randevuSil(randevuId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/randevular/${randevuId}`, { headers: this.headers });
  }

  // Yeni çalışan ekle
  calisanEkle(calisan: {
    ad: string;
    soyad: string;
    email?: string;
    parola?: string;
    baslangic_saati: string;
    bitis_saati: string;
    isletme_id: number;
  }): Observable<Calisan> {
    return this.http.post<Calisan>(`${this.apiUrl}/calisanlar`, calisan, { headers: this.headers });
  }

  // Çalışanları listele (işletmeye göre)
  getCalisanlar(isletmeId: number): Observable<Calisan[]> {
    let params = new HttpParams();
    params = params.set('isletme_id', isletmeId.toString());
    return this.http.get<Calisan[]>(`${this.apiUrl}/calisanlar`, { headers: this.headers, params });
  }

  // Çalışan sil
  calisanSil(isletmeId: number, calisanId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/isletmeler/${isletmeId}/calisanlar/${calisanId}`);
  }

  // Çalışan güncelle
  calisanGuncelle(isletmeId: number, calisanId: number, calisan: Partial<Calisan>): Observable<Calisan> {
    return this.http.patch<Calisan>(`${this.apiUrl}/isletmeler/${isletmeId}/calisanlar/${calisanId}`, calisan);
  }

  // Randevuları listele (işletmeye göre, filtreli)
  getRandevular(isletmeId: number, durum?: string, tarih?: string): Observable<Randevu[]> {
    let params = new HttpParams();
    params = params.set('isletme_id', isletmeId.toString());
    if (durum) params = params.set('durum', durum);
    if (tarih) params = params.set('tarih', tarih);
    return this.http.get<Randevu[]>(`${this.apiUrl}/randevular`, { headers: this.headers, params });
  }

  // Randevu durumunu güncelle
  randevuGuncelle(randevuId: number, durum: string): Observable<Randevu> {
    return this.http.patch<Randevu>(`${this.apiUrl}/randevular/${randevuId}`, { durum }, { headers: this.headers });
  }
}
