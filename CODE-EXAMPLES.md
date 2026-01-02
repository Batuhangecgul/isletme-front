# 💻 Kod Örnekleri ve Best Practices

Bu doküman, projede kullanılan mimari pattern'lerin ve state management tekniklerinin pratik kod örneklerini içerir.

## 📋 İçindekiler

1. [Service Creation](#service-creation)
2. [Component State Management](#component-state-management)
3. [Reactive Forms](#reactive-forms)
4. [HTTP Interceptors](#http-interceptors)
5. [Error Handling](#error-handling)
6. [Authentication Patterns](#authentication-patterns)
7. [Common Patterns](#common-patterns)

---

## 🛎️ Service Creation

### Temel Servis Yapısı

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Isletme {
  id: number;
  isim: string;
  kategori?: string;
  adres?: string;
}

@Injectable({
  providedIn: 'root'  // Singleton service
})
export class IsletmeService {
  
  // Private API URL
  private apiUrl = environment.apiBaseUrl;
  
  // Shared state with BehaviorSubject
  private isletmelerSubject = new BehaviorSubject<Isletme[]>([]);
  public isletmeler$ = this.isletmelerSubject.asObservable();
  
  // HTTP headers
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });
  
  constructor(private http: HttpClient) { }
  
  // ========== CRUD Operations ==========
  
  // GET: Tüm işletmeleri getir
  getIsletmeler(): Observable<Isletme[]> {
    return this.http.get<Isletme[]>(`${this.apiUrl}/isletmeler`, { 
      headers: this.headers 
    }).pipe(
      tap(isletmeler => this.isletmelerSubject.next(isletmeler)),
      catchError(this.handleError)
    );
  }
  
  // GET: Tek işletme getir
  getIsletme(id: number): Observable<Isletme> {
    return this.http.get<Isletme>(`${this.apiUrl}/isletmeler/${id}`, { 
      headers: this.headers 
    });
  }
  
  // POST: Yeni işletme ekle
  createIsletme(isletme: Partial<Isletme>): Observable<Isletme> {
    return this.http.post<Isletme>(`${this.apiUrl}/isletmeler`, isletme, { 
      headers: this.headers 
    }).pipe(
      tap(newIsletme => {
        // State'i güncelle
        const current = this.isletmelerSubject.value;
        this.isletmelerSubject.next([...current, newIsletme]);
      })
    );
  }
  
  // PATCH: İşletme güncelle
  updateIsletme(id: number, data: Partial<Isletme>): Observable<Isletme> {
    return this.http.patch<Isletme>(`${this.apiUrl}/isletmeler/${id}`, data, { 
      headers: this.headers 
    }).pipe(
      tap(updatedIsletme => {
        // State'i güncelle
        const current = this.isletmelerSubject.value;
        const index = current.findIndex(i => i.id === id);
        if (index !== -1) {
          current[index] = updatedIsletme;
          this.isletmelerSubject.next([...current]);
        }
      })
    );
  }
  
  // DELETE: İşletme sil
  deleteIsletme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/isletmeler/${id}`, { 
      headers: this.headers 
    }).pipe(
      tap(() => {
        // State'i güncelle
        const current = this.isletmelerSubject.value;
        this.isletmelerSubject.next(current.filter(i => i.id !== id));
      })
    );
  }
  
  // ========== Helper Methods ==========
  
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    throw error;
  }
}
```

---

## 📦 Component State Management

### Kapsamlı Component Örneği

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IsletmeService, Isletme } from '../services/isletme.service';

@Component({
  selector: 'app-isletme-list',
  templateUrl: './isletme-list.component.html',
  styleUrls: ['./isletme-list.component.css']
})
export class IsletmeListComponent implements OnInit, OnDestroy {
  
  // ========== UI State ==========
  yukleniyor = true;
  hata: string | null = null;
  modalAcik = false;
  isDarkMode = false;
  
  // ========== Data State ==========
  isletmeler: Isletme[] = [];
  filtrelenmisIsletmeler: Isletme[] = [];
  seciliIsletme: Isletme | null = null;
  
  // ========== Form State ==========
  aramaMetni = '';
  selectedKategori = 'tumu';
  
  // ========== Pagination State ==========
  mevcutSayfa = 1;
  sayfaBasinaItem = 20;
  toplamSayfa = 1;
  
  // ========== Subscription Management ==========
  private destroy$ = new Subject<void>();
  
  // ========== Computed Properties ==========
  get gosterilecekIsletmeler(): Isletme[] {
    const baslangic = (this.mevcutSayfa - 1) * this.sayfaBasinaItem;
    const bitis = baslangic + this.sayfaBasinaItem;
    return this.filtrelenmisIsletmeler.slice(baslangic, bitis);
  }
  
  get isEmpty(): boolean {
    return !this.yukleniyor && this.filtrelenmisIsletmeler.length === 0;
  }
  
  get hasError(): boolean {
    return this.hata !== null;
  }
  
  // ========== Constructor & Lifecycle ==========
  
  constructor(private isletmeService: IsletmeService) { }
  
  ngOnInit(): void {
    this.loadIsletmeler();
    this.subscribeToStateChanges();
    this.loadUserPreferences();
  }
  
  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ========== Data Loading ==========
  
  loadIsletmeler(): void {
    this.yukleniyor = true;
    this.hata = null;
    
    this.isletmeService.getIsletmeler()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.isletmeler = data;
          this.filtrelenmisIsletmeler = data;
          this.hesaplaSayfaSayisi();
          this.yukleniyor = false;
        },
        error: (err) => {
          this.hata = 'İşletmeler yüklenirken bir hata oluştu.';
          this.yukleniyor = false;
          console.error('Load error:', err);
        }
      });
  }
  
  // ========== State Subscriptions ==========
  
  subscribeToStateChanges(): void {
    // Shared state'e subscribe
    this.isletmeService.isletmeler$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isletmeler => {
        this.isletmeler = isletmeler;
        this.applyFilters();
      });
  }
  
  // ========== Filtering & Search ==========
  
  ara(): void {
    this.applyFilters();
    this.mevcutSayfa = 1;
  }
  
  private applyFilters(): void {
    const metin = this.aramaMetni.toLowerCase().trim();
    
    this.filtrelenmisIsletmeler = this.isletmeler.filter(isletme => {
      // Text search
      const matchesText = !metin || 
        isletme.isim.toLowerCase().includes(metin) ||
        (isletme.kategori?.toLowerCase().includes(metin) || false) ||
        (isletme.adres?.toLowerCase().includes(metin) || false);
      
      // Category filter
      const matchesKategori = this.selectedKategori === 'tumu' || 
        isletme.kategori === this.selectedKategori;
      
      return matchesText && matchesKategori;
    });
    
    this.hesaplaSayfaSayisi();
  }
  
  // ========== Pagination ==========
  
  hesaplaSayfaSayisi(): void {
    this.toplamSayfa = Math.ceil(
      this.filtrelenmisIsletmeler.length / this.sayfaBasinaItem
    );
    if (this.toplamSayfa === 0) this.toplamSayfa = 1;
  }
  
  sonrakiSayfa(): void {
    if (this.mevcutSayfa < this.toplamSayfa) {
      this.mevcutSayfa++;
    }
  }
  
  oncekiSayfa(): void {
    if (this.mevcutSayfa > 1) {
      this.mevcutSayfa--;
    }
  }
  
  sayfayaGit(sayfa: number): void {
    if (sayfa >= 1 && sayfa <= this.toplamSayfa) {
      this.mevcutSayfa = sayfa;
    }
  }
  
  // ========== Modal Management ==========
  
  detayGoster(isletme: Isletme): void {
    this.seciliIsletme = isletme;
    this.modalAcik = true;
  }
  
  modalKapat(): void {
    this.modalAcik = false;
    this.seciliIsletme = null;
  }
  
  // ========== User Preferences ==========
  
  private loadUserPreferences(): void {
    const darkMode = localStorage.getItem('darkMode');
    this.isDarkMode = darkMode === 'true';
    
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }
  
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
  
  // ========== Refresh ==========
  
  refresh(): void {
    this.loadIsletmeler();
  }
}
```

---

## 📝 Reactive Forms

### Form with Validation (Template-driven'dan Reactive'e geçiş örneği)

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-reactive',
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <input 
          type="text" 
          formControlName="telefon"
          placeholder="Telefon"
          [class.error]="telefon?.invalid && telefon?.touched">
        <div *ngIf="telefon?.invalid && telefon?.touched" class="error-message">
          <span *ngIf="telefon?.errors?.['required']">Telefon gereklidir</span>
          <span *ngIf="telefon?.errors?.['pattern']">Geçersiz telefon formatı</span>
        </div>
      </div>
      
      <div class="form-group">
        <input 
          type="password" 
          formControlName="parola"
          placeholder="Şifre"
          [class.error]="parola?.invalid && parola?.touched">
        <div *ngIf="parola?.invalid && parola?.touched" class="error-message">
          <span *ngIf="parola?.errors?.['required']">Şifre gereklidir</span>
          <span *ngIf="parola?.errors?.['minlength']">
            Şifre en az 6 karakter olmalı
          </span>
        </div>
      </div>
      
      <button 
        type="submit" 
        [disabled]="loginForm.invalid || loading">
        {{ loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
      </button>
      
      <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>
    </form>
  `
})
export class LoginReactiveComponent implements OnInit {
  
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) { }
  
  ngOnInit(): void {
    this.initForm();
  }
  
  // Form initialization
  private initForm(): void {
    this.loginForm = this.fb.group({
      telefon: ['', [
        Validators.required,
        Validators.pattern(/^(0)?5\d{9}$/)
      ]],
      parola: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }
  
  // Getters for easy template access
  get telefon() {
    return this.loginForm.get('telefon');
  }
  
  get parola() {
    return this.loginForm.get('parola');
  }
  
  // Form submission
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    
    const { telefon, parola } = this.loginForm.value;
    
    this.authService.login(telefon, parola).subscribe({
      next: () => {
        this.loading = false;
        // Navigate to dashboard
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Giriş başarısız';
      }
    });
  }
  
  // Form reset
  resetForm(): void {
    this.loginForm.reset();
    this.errorMessage = '';
  }
}
```

---

## 🔐 HTTP Interceptors

### Advanced Auth Interceptor

```typescript
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AdvancedAuthInterceptor implements HttpInterceptor {
  
  private isRefreshing = false;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // Skip auth for login/signup endpoints
    if (this.isAuthEndpoint(req.url)) {
      return next.handle(req);
    }
    
    // Add token to request
    const token = this.authService.getToken();
    if (token) {
      req = this.addToken(req, token);
    }
    
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(req, next);
        }
        return throwError(() => error);
      })
    );
  }
  
  // Add Authorization header
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // Check if endpoint is auth-related
  private isAuthEndpoint(url: string): boolean {
    return url.includes('/login') || url.includes('/signup');
  }
  
  // Handle 401 Unauthorized
  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      
      // Try to refresh token (if you have refresh token endpoint)
      // For now, just logout and redirect
      this.authService.forceLogout();
      this.router.navigate(['/login']);
      this.isRefreshing = false;
    }
    
    return throwError(() => new Error('Unauthorized'));
  }
}
```

### Logging Interceptor

```typescript
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const started = Date.now();
    let status = 'succeeded';
    
    // Log request
    console.log(`🚀 ${req.method} ${req.urlWithParams}`);
    
    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            status = 'succeeded';
            console.log(`✅ ${req.method} ${req.urlWithParams} - ${event.status}`);
          }
        },
        error: (error) => {
          status = 'failed';
          console.error(`❌ ${req.method} ${req.urlWithParams} - ${error.status}`);
        }
      }),
      finalize(() => {
        const elapsed = Date.now() - started;
        console.log(`⏱️ Request ${status} in ${elapsed}ms`);
      })
    );
  }
}
```

---

## ⚠️ Error Handling

### Comprehensive Error Handler Service

```typescript
import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface AppError {
  status: number;
  message: string;
  timestamp: Date;
  url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  
  // Handle HTTP errors
  handleHttpError(error: HttpErrorResponse, url?: string): Observable<never> {
    const appError: AppError = {
      status: error.status,
      message: this.getErrorMessage(error),
      timestamp: new Date(),
      url
    };
    
    // Log error
    this.logError(appError);
    
    // Show user-friendly message
    this.showErrorToUser(appError);
    
    return throwError(() => appError);
  }
  
  // Extract error message
  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return error.error.message;
    } else {
      // Server-side error
      if (error.error?.message) {
        return error.error.message;
      }
      
      switch (error.status) {
        case 0:
          return 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
        case 400:
          return 'Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin.';
        case 401:
          return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
        case 403:
          return 'Bu işlem için yetkiniz yok.';
        case 404:
          return 'İstenen kaynak bulunamadı.';
        case 500:
          return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        default:
          return `Beklenmeyen bir hata oluştu (${error.status})`;
      }
    }
  }
  
  // Log error to console (or send to logging service)
  private logError(error: AppError): void {
    console.error('Application Error:', {
      status: error.status,
      message: error.message,
      timestamp: error.timestamp,
      url: error.url
    });
    
    // TODO: Send to external logging service (e.g., Sentry, LogRocket)
  }
  
  // Show error to user (could use toast/snackbar service)
  private showErrorToUser(error: AppError): void {
    // For now, just alert (in production, use a toast service)
    // this.toastService.error(error.message);
    console.warn('User Error:', error.message);
  }
}
```

### Usage in Component

```typescript
export class MyComponent {
  
  constructor(
    private service: MyService,
    private errorHandler: ErrorHandlerService
  ) { }
  
  loadData(): void {
    this.service.getData()
      .pipe(
        catchError(err => this.errorHandler.handleHttpError(err, '/api/data'))
      )
      .subscribe({
        next: (data) => {
          // Handle success
        }
        // No error handler needed - handled by ErrorHandlerService
      });
  }
}
```

---

## 🔑 Authentication Patterns

### Route Guard

```typescript
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (this.authService.isLoggedIn()) {
      return true;
    }
    
    // Redirect to login with return URL
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}

// Usage in routing module:
// { path: 'isletme-panel/:id', component: IsletmePanelComponent, canActivate: [AuthGuard] }
```

---

## 🎨 Common Patterns

### Debounced Search

```typescript
import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  template: `
    <input 
      type="text" 
      [(ngModel)]="searchTerm"
      (ngModelChange)="onSearchChange($event)"
      placeholder="Ara...">
  `
})
export class SearchComponent implements OnInit {
  
  searchTerm = '';
  private searchSubject = new Subject<string>();
  
  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),           // 300ms bekle
      distinctUntilChanged()        // Değişiklik varsa
    ).subscribe(term => {
      this.performSearch(term);
    });
  }
  
  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }
  
  performSearch(term: string): void {
    console.log('Searching for:', term);
    // Actual search logic
  }
}
```

### Loading State Manager

```typescript
export class LoadingStateManager {
  private loadingMap = new Map<string, boolean>();
  
  setLoading(key: string, loading: boolean): void {
    this.loadingMap.set(key, loading);
  }
  
  isLoading(key: string): boolean {
    return this.loadingMap.get(key) || false;
  }
  
  isAnyLoading(): boolean {
    return Array.from(this.loadingMap.values()).some(loading => loading);
  }
}

// Usage
export class MyComponent {
  loadingManager = new LoadingStateManager();
  
  loadData(): void {
    this.loadingManager.setLoading('data', true);
    
    this.service.getData().subscribe({
      next: () => this.loadingManager.setLoading('data', false),
      error: () => this.loadingManager.setLoading('data', false)
    });
  }
}
```

---

**Son Güncelleme**: 2 Ocak 2026
**Proje**: İşletme Randevu Sistemi Frontend
