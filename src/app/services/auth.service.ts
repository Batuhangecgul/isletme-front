import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Isletme {
  id?: number;
  isletme_id?: number;
  isim: string;
  ad?: string;
  kategori?: string;
  adres?: string;
  telefon?: string;
  puan?: number;
  resim?: string;
  fotograf?: string;
  zaman_artisi?: number;
}

export interface LoginResponse {
  token: string;
  isletme: Isletme;
}

export interface SignupRequest {
  isim: string;
  parola: string;
  telefon: string;
  adres?: {
    il?: string;
    ilce?: string;
    mahalle?: string;
    sokak?: string;
  } | string;
  kategori?: string;
  zaman_artisi?: number;
}

export interface SignupResponse {
  message: string;
  isletme: Isletme;
}

export interface ProfilResponse {
  isletme: Isletme;
  bekleyen_randevular: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiBaseUrl;
  private tokenKey = 'token';
  private isletmeKey = 'isletme';

  // Kullanıcı durumu için BehaviorSubject
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private currentIsletmeSubject = new BehaviorSubject<Isletme | null>(this.getStoredIsletme());
  currentIsletme$ = this.currentIsletmeSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ==================== TOKEN YÖNETİMİ ====================

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isLoggedInSubject.next(true);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.isletmeKey);
    this.isLoggedInSubject.next(false);
    this.currentIsletmeSubject.next(null);
  }

  // API çağrısı olmadan local çıkış (hata durumunda kullanılır)
  forceLogout(): void {
    this.removeToken();
  }

  // ==================== İŞLETME BİLGİSİ ====================

  private getStoredIsletme(): Isletme | null {
    const data = localStorage.getItem(this.isletmeKey);
    return data ? JSON.parse(data) : null;
  }

  private setStoredIsletme(isletme: Isletme): void {
    localStorage.setItem(this.isletmeKey, JSON.stringify(isletme));
    this.currentIsletmeSubject.next(isletme);
  }

  getCurrentIsletme(): Isletme | null {
    return this.currentIsletmeSubject.value;
  }

  // ==================== AUTH HEADER ====================

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== AUTH İŞLEMLERİ ====================

  // Giriş yap
  login(telefon: string, parola: string): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return this.http.post<LoginResponse>(`${this.apiUrl}/isletmeler/login`, { telefon, parola }, { headers })
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setStoredIsletme(response.isletme);
        })
      );
  }

  // Kayıt ol (yeni işletme)
  signup(data: SignupRequest): Observable<SignupResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    return this.http.post<SignupResponse>(`${this.apiUrl}/isletmeler`, data, { headers });
  }

  // Çıkış yap
  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/isletmeler/logout`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.removeToken();
      })
    );
  }

  // Profil getir (AUTH GEREKLİ)
  getProfil(): Observable<ProfilResponse> {
    return this.http.get<ProfilResponse>(`${this.apiUrl}/isletmeler/profil`, {
      headers: this.getAuthHeaders()
    });
  }

  // İşletme güncelle (AUTH GEREKLİ)
  isletmeGuncelle(data: {
    isim?: string;
    telefon?: string;
    adres?: string;
    kategori?: string;
    parola?: string;
    zaman_artisi?: number;
  }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/isletmeler/guncelle`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        // Güncellenen işletme bilgisini localStorage'a kaydet
        if (response.isletme) {
          this.setStoredIsletme(response.isletme);
        }
      })
    );
  }

  // Fotoğraf güncelle (AUTH GEREKLİ - FormData ile)
  fotografGuncelle(file: File): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Content-Type otomatik olarak multipart/form-data olacak
    });

    const formData = new FormData();
    formData.append('fotograf', file, file.name);
    // Laravel için method spoofing
    formData.append('_method', 'PATCH');

    // POST kullanıyoruz çünkü PATCH ile FormData sorun çıkarabiliyor
    return this.http.post<any>(`${this.apiUrl}/isletmeler/guncelle`, formData, { headers }).pipe(
      tap(response => {
        if (response.isletme) {
          this.setStoredIsletme(response.isletme);
        }
      })
    );
  }

  // Giriş durumu kontrol
  isLoggedIn(): boolean {
    return this.hasToken();
  }

  // Oturumu kapat (lokal)
  clearSession(): void {
    this.removeToken();
  }
}
