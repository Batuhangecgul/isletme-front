import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // ==================== MÜŞTERİ AKIŞI ====================

  // 1. İşletme listesi
  getIsletmeler(): Observable<Isletme[]> {
    return this.http.get<Isletme[]>(`${this.apiUrl}/isletmeler`);
  }

  // 2. Seçilen işletme + çalışanları
  getIsletme(id: number): Observable<Isletme> {
    return this.http.get<Isletme>(`${this.apiUrl}/isletmeler/${id}`);
  }

  // 3. Dolu slotları getir
  getDoluSlotlar(calisanId: number, tarih: string): Observable<Randevu[]> {
    return this.http.get<Randevu[]>(`${this.apiUrl}/randevular?calisan_id=${calisanId}&tarih=${tarih}`);
  }

  // 4. Randevu al (durum: false)
  randevuAl(randevu: Partial<Randevu>): Observable<Randevu> {
    return this.http.post<Randevu>(`${this.apiUrl}/randevular`, randevu);
  }

  // ==================== İŞLETME PANELİ AKIŞI ====================

  // Randevu onayla (durum: true)
  randevuOnayla(randevuId: number): Observable<Randevu> {
    return this.http.patch<Randevu>(`${this.apiUrl}/randevular/${randevuId}`, { durum: true });
  }

  // Randevu reddet/sil
  randevuSil(randevuId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/randevular/${randevuId}`);
  }

  // Yeni çalışan ekle
  calisanEkle(calisan: {
    ad: string;
    soyad: string;
    baslangic_saati: string;
    bitis_saati: string;
    isletme_id: number;
  }): Observable<Calisan> {
    return this.http.post<Calisan>(`${this.apiUrl}/calisanlar`, calisan);
  }

  // Çalışanları listele (işletmeye göre)
  getCalisanlar(isletmeId: number): Observable<Calisan[]> {
    return this.http.get<Calisan[]>(`${this.apiUrl}/calisanlar?isletme_id=${isletmeId}`);
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
    let url = `${this.apiUrl}/randevular?isletme_id=${isletmeId}`;
    if (durum) url += `&durum=${durum}`;
    if (tarih) url += `&tarih=${tarih}`;
    return this.http.get<Randevu[]>(url);
  }

  // Randevu durumunu güncelle
  randevuGuncelle(randevuId: number, durum: string): Observable<Randevu> {
    return this.http.patch<Randevu>(`${this.apiUrl}/randevular/${randevuId}`, { durum });
  }
}
