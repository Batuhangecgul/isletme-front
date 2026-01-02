# 🏗️ İşletme Front - Mimari Dokümantasyonu

Bu doküman, **İşletme Randevu Sistemi Frontend** projesinin mimari yapısını, kullanılan design pattern'leri ve state management yaklaşımını detaylı olarak açıklar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Proje Yapısı](#proje-yapısı)
4. [Mimari Katmanlar](#mimari-katmanlar)
5. [State Management](#state-management)
6. [Design Patterns](#design-patterns)
7. [Veri Akışı](#veri-akışı)
8. [Best Practices](#best-practices)

---

## 🎯 Genel Bakış

Bu proje, **Angular 14** framework'ü kullanılarak geliştirilmiş modern bir Single Page Application (SPA)'dır. Proje, **layered architecture** (katmanlı mimari) prensiplerine uygun olarak tasarlanmıştır.

### Mimari Prensipleri

- **Separation of Concerns (SoC)**: Her katmanın belirli bir sorumluluğu vardır
- **Dependency Injection**: Angular'ın DI sistemi kullanılır
- **Reactive Programming**: RxJS ile reaktif programlama
- **Component-Based Architecture**: Yeniden kullanılabilir bileşenler

---

## 🛠️ Teknoloji Stack

### Core Framework
- **Angular 14**: Frontend framework
- **TypeScript 4.7**: Statik tip kontrolü
- **RxJS 7.5**: Reactive programming

### HTTP & State Management
- **HttpClient**: HTTP istekleri için Angular modülü
- **BehaviorSubject**: State yönetimi için RxJS
- **LocalStorage**: Tarayıcı tabanlı persistence

### Routing & Forms
- **Angular Router**: SPA routing
- **Angular Forms**: Form yönetimi (Template-driven)

### Testing
- **Jasmine**: Test framework
- **Karma**: Test runner

---

## 📁 Proje Yapısı

```
src/app/
│
├── core/                          # Çekirdek modüller (singleton servisler)
│   └── http/
│       ├── auth.interceptor.ts    # JWT token interceptor
│       └── error.interceptor.ts   # Global hata yakalama
│
├── services/                      # İş mantığı servisleri
│   ├── auth.service.ts            # Kimlik doğrulama servisi
│   ├── isletme.service.ts         # İşletme CRUD operasyonları
│   └── sorulama-servisi.service.ts # Randevu sorgulama servisi
│
├── anasayfa/                      # Ana sayfa feature modülü
│   ├── anasayfa.component.ts      # Ana sayfa logic
│   ├── randevu/                   # Randevu alma alt bileşeni
│   └── randevu-sorgulama/         # Randevu sorgulama alt bileşeni
│
├── login/                         # Giriş/Kayıt feature modülü
│   └── login.component.ts
│
├── isletme-panel/                 # İşletme yönetim paneli
│   └── isletme-panel.component.ts
│
├── app-routing.module.ts          # Route tanımları
└── app.module.ts                  # Root modül
```

### Klasör Yapısı Açıklaması

#### 🔐 `core/`
Uygulama genelinde kullanılan **singleton servisler** ve **interceptor'lar**. Bu katman bir kez yüklenir ve tüm uygulama boyunca aynı instance kullanılır.

#### 🛎️ `services/`
İş mantığını içeren servisler. HTTP istekleri, veri manipülasyonu ve state yönetimi burada yapılır.

#### 📦 Feature Modülleri (`anasayfa/`, `login/`, `isletme-panel/`)
Her feature kendi içinde bağımsızdır ve lazy loading için hazırdır (şu an eager loading kullanılıyor).

---

## 🏛️ Mimari Katmanlar

### 1. Presentation Layer (Sunum Katmanı)
**Konum**: `*.component.ts`, `*.component.html`

**Sorumluluklar**:
- Kullanıcı arayüzünü render etme
- Kullanıcı etkileşimlerini yakalama
- Servisleri çağırma
- UI state yönetimi (loading, error states)

**Örnek**: `anasayfa.component.ts`
```typescript
export class AnasayfaComponent {
  isletmeler: Isletme[] = [];
  yukleniyor = true;
  
  constructor(private isletmeService: IsletmeService) {}
  
  ngOnInit(): void {
    this.isletmeleriYukle();
  }
  
  isletmeleriYukle(): void {
    this.isletmeService.getIsletmeler().subscribe({
      next: (data) => {
        this.isletmeler = data;
        this.yukleniyor = false;
      },
      error: (err) => {
        console.error('Hata:', err);
        this.yukleniyor = false;
      }
    });
  }
}
```

### 2. Service Layer (Servis Katmanı)
**Konum**: `services/`

**Sorumluluklar**:
- HTTP API çağrıları
- State yönetimi (BehaviorSubject ile)
- İş mantığı
- Data transformation

**Örnek**: `auth.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  login(telefon: string, parola: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { telefon, parola })
      .pipe(tap(response => this.setToken(response.token)));
  }
}
```

### 3. Core Layer (Çekirdek Katman)
**Konum**: `core/`

**Sorumluluklar**:
- HTTP interceptor'lar
- Global error handling
- Authentication logic
- Singleton servisler

**Örnek**: `auth.interceptor.ts`
```typescript
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('token');
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(req);
  }
}
```

---

## 🔄 State Management

Bu proje, **basit ve etkili** bir state management yaklaşımı kullanır. Karmaşık state management kütüphaneleri (NgRx, Akita) yerine Angular'ın built-in araçları tercih edilmiştir.

### State Management Stratejileri

#### 1. **Component State** (Lokal State)
Her component kendi state'ini yönetir.

```typescript
export class AnasayfaComponent {
  // Component-level state
  isletmeler: Isletme[] = [];
  filtrelenmisIsletmeler: Isletme[] = [];
  yukleniyor = true;
  aramaMetni = '';
  mevcutSayfa = 1;
}
```

**Kullanım Alanı**: UI-specific state (loading, modal açık/kapalı, form değerleri)

#### 2. **Service State** (Shared State)
BehaviorSubject ile servis içinde state tutma.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Global application state
  private currentIsletmeSubject = new BehaviorSubject<Isletme | null>(null);
  currentIsletme$ = this.currentIsletmeSubject.asObservable();
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
}
```

**Kullanım Alanı**: Uygulama genelinde paylaşılan state (user info, auth status)

#### 3. **Browser Storage State** (Persistent State)
LocalStorage ile kalıcı state yönetimi.

```typescript
// Okuma
const token = localStorage.getItem('token');
const isletme = JSON.parse(localStorage.getItem('isletme'));

// Yazma
localStorage.setItem('token', token);
localStorage.setItem('isletme', JSON.stringify(isletme));

// Silme
localStorage.removeItem('token');
```

**Kullanım Alanı**: Oturum bilgileri, kullanıcı tercihleri (dark mode)

### State Yönetimi Best Practices

✅ **DO (Yapılması Gerekenler)**:
- Component state'i için private property'ler kullan
- Shared state için BehaviorSubject kullan
- State değişimlerinde immutability prensibine uy
- Subscription'ları ngOnDestroy'da temizle

❌ **DON'T (Yapılmaması Gerekenler)**:
- Component'ler arası doğrudan state paylaşımı yapma
- LocalStorage'ı aşırı kullanma (sadece persistence için)
- State'i doğrudan mutate etme

---

## 🎨 Design Patterns

### 1. **Dependency Injection Pattern**

Angular'ın DI sistemi kullanılarak servisler inject edilir.

```typescript
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
}
```

**Faydaları**:
- Loose coupling (gevşek bağlılık)
- Test edilebilirlik
- Kodun yeniden kullanılabilirliği

### 2. **Observable Pattern (Reactive Programming)**

RxJS Observable'lar ile asenkron veri akışı yönetimi.

```typescript
// Service
getIsletmeler(): Observable<Isletme[]> {
  return this.http.get<Isletme[]>(`${this.apiUrl}/isletmeler`);
}

// Component
this.isletmeService.getIsletmeler().subscribe({
  next: (data) => this.isletmeler = data,
  error: (err) => console.error(err)
});
```

**Faydaları**:
- Asenkron işlemleri kolayca yönetme
- Data transformation (map, filter, tap)
- Error handling

### 3. **Interceptor Pattern**

HTTP isteklerini merkezi olarak yakalama ve işleme.

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Her HTTP isteğine token ekle
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next.handle(authReq);
  }
}
```

**Kullanım Alanları**:
- Authentication token ekleme
- Error handling
- Logging
- Caching

### 4. **Singleton Pattern**

Servisler `providedIn: 'root'` ile singleton olarak oluşturulur.

```typescript
@Injectable({
  providedIn: 'root'  // Singleton instance
})
export class AuthService { }
```

**Faydaları**:
- Tek bir instance, memory efficiency
- Global state yönetimi
- Tutarlı veri

### 5. **Repository Pattern (Implicit)**

Service layer, backend ile etkileşimi soyutlar (implicit repository pattern).

```typescript
// Service acts as repository
export class IsletmeService {
  getIsletmeler(): Observable<Isletme[]> { }
  getIsletme(id: number): Observable<Isletme> { }
  randevuAl(randevu: Randevu): Observable<Randevu> { }
}
```

---

## 🔀 Veri Akışı

### 1. Kullanıcı Girişi Akışı

```
[LoginComponent]
       ↓
  onLogin() çağrılır
       ↓
[AuthService]
       ↓
  login(telefon, parola)
       ↓
  HTTP POST → Backend API
       ↓
  Response: { token, isletme }
       ↓
  setToken() → localStorage
       ↓
  isLoggedInSubject.next(true)
       ↓
[Router] → navigate('/isletme-panel/:id')
```

### 2. İşletme Listeleme Akışı

```
[AnasayfaComponent]
       ↓
  ngOnInit()
       ↓
  isletmeleriYukle()
       ↓
[IsletmeService]
       ↓
  getIsletmeler()
       ↓
  HTTP GET → Backend API
       ↓
  Response: Isletme[]
       ↓
  Component: isletmeler = data
       ↓
[Template] → *ngFor ile render
```

### 3. HTTP Request Flow (Interceptor ile)

```
[Component] 
    → Service.method()
         ↓
    [AuthInterceptor]
         ↓
    Token eklenir
         ↓
    [Backend API]
         ↓
    Response
         ↓
    [ErrorInterceptor]
         ↓
    Error handling
         ↓
    [Component]
         ↓
    subscribe({ next, error })
```

---

## ✅ Best Practices

### 1. **Servis Organizasyonu**

```typescript
// ✅ İyi: Specific, single responsibility
@Injectable({ providedIn: 'root' })
export class AuthService {
  login() { }
  logout() { }
  isLoggedIn() { }
}

// ❌ Kötü: God service (her şeyi yapan servis)
export class AppService {
  login() { }
  getIsletmeler() { }
  getRandevular() { }
  // ...
}
```

### 2. **Observable Subscription Yönetimi**

```typescript
// ✅ İyi: Subscription cleanup
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.service.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => { });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// ❌ Kötü: Memory leak
export class MyComponent {
  ngOnInit() {
    this.service.getData().subscribe(data => { });
    // Subscription temizlenmiyor!
  }
}
```

### 3. **Error Handling**

```typescript
// ✅ İyi: Merkezi error handling
this.service.getData().subscribe({
  next: (data) => this.handleData(data),
  error: (err) => this.handleError(err)
});

// Interceptor seviyesinde
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req, next) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Global error handling
        console.error('HTTP Error:', error);
        return throwError(() => error);
      })
    );
  }
}
```

### 4. **Type Safety**

```typescript
// ✅ İyi: Interface kullanımı
export interface Isletme {
  id: number;
  isim: string;
  kategori?: string;
}

getIsletme(id: number): Observable<Isletme> {
  return this.http.get<Isletme>(`${this.apiUrl}/isletmeler/${id}`);
}

// ❌ Kötü: any kullanımı
getIsletme(id: number): Observable<any> { }
```

### 5. **Environment Configuration**

```typescript
// ✅ İyi: Environment dosyaları
// environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000/api'
};

// Service
private apiUrl = environment.apiBaseUrl;

// ❌ Kötü: Hard-coded URL'ler
private apiUrl = 'http://localhost:8000/api';
```

---

## 🔐 Security Best Practices

### 1. **Token Yönetimi**
- JWT token'ları localStorage'da saklanır
- Her HTTP isteğinde AuthInterceptor otomatik ekler
- Logout'ta token temizlenir

### 2. **Input Validation**
```typescript
// Telefon numarası validasyonu
private validatePhone(phone: string): boolean {
  const phoneRegex = /^(0)?5\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}
```

### 3. **XSS Koruması**
Angular otomatik olarak XSS'e karşı koruma sağlar (template sanitization).

---

## 📊 Performance Optimizations

### 1. **Lazy Loading** (Gelecek İyileştirme)
```typescript
// Şu anki: Eager loading
imports: [BrowserModule, AppRoutingModule, ...]

// Önerilen: Lazy loading
const routes: Routes = [
  {
    path: 'isletme-panel',
    loadChildren: () => import('./isletme-panel/isletme-panel.module')
      .then(m => m.IsletmePanelModule)
  }
];
```

### 2. **OnPush Change Detection** (Gelecek İyileştirme)
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent { }
```

### 3. **TrackBy Function**
```typescript
// Template
<div *ngFor="let item of items; trackBy: trackById">

// Component
trackById(index: number, item: Isletme): number {
  return item.id;
}
```

---

## 🚀 Gelecek İyileştirmeler

1. **State Management**: NgRx veya Akita gibi advanced state management
2. **Lazy Loading**: Feature modüllerinin lazy loading'i
3. **Guards**: Route guards (AuthGuard, RoleGuard)
4. **Resolvers**: Data pre-loading
5. **Reactive Forms**: Template-driven yerine reactive forms
6. **PWA**: Progressive Web App özellikleri
7. **Service Worker**: Offline support
8. **Unit Tests**: Daha kapsamlı test coverage

---

## 📚 Referanslar

- [Angular Official Documentation](https://angular.io/docs)
- [RxJS Documentation](https://rxjs.dev/)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Son Güncelleme**: 2 Ocak 2026
**Proje Versiyonu**: 0.0.0
**Angular Versiyonu**: 14.2.0
