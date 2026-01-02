# State Management ve Önemli Mimariler - Proje Özeti

Bu doküman, "Merhaba bu projede state menagment ve diger onemli mimariler nasıl planlanmıs ve nasıl yapılıyor anlat" sorusuna detaylı yanıt verir.

---

## 📊 State Management Nasıl Yapılıyor?

Bu projede state management (durum yönetimi) **3 farklı seviyede** yapılmaktadır:

### 1. Component-Level State (Bileşen Seviyesi State)

**Nedir?**: Her component'in kendi lokal state'i vardır.

**Nasıl Yapılıyor?**:
```typescript
export class AnasayfaComponent {
  // UI State - Loading göstergesi, modal durumu
  yukleniyor = true;
  modalAcik = false;
  
  // Data State - Backend'den gelen veriler
  isletmeler: Isletme[] = [];
  
  // Form State - Kullanıcı girişleri
  aramaMetni = '';
}
```

**Ne Zaman Kullanılır?**: 
- Sadece o component'te kullanılan veriler için
- UI durumları (loading, error, modal açık/kapalı)
- Form değerleri

---

### 2. Service-Level State (Servis Seviyesi - Global State)

**Nedir?**: Birden fazla component arasında paylaşılan state.

**Nasıl Yapılıyor?**: **RxJS BehaviorSubject** kullanılıyor.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  
  // 1. Private BehaviorSubject (state container)
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  
  // 2. Public Observable (sadece okunabilir)
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  // 3. State güncelleme
  login(telefon: string, parola: string) {
    return this.http.post('/login', { telefon, parola })
      .pipe(
        tap(response => {
          // State'i güncelle
          this.isLoggedInSubject.next(true);
        })
      );
  }
}
```

**Component'te Kullanımı**:
```typescript
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit() {
    // State değişikliklerini dinle
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }
}
```

**Ne Zaman Kullanılır?**:
- Kullanıcı bilgileri (currentUser, isLoggedIn)
- Uygulama genelinde kullanılan veriler
- Birden fazla component'in erişmesi gereken state

**Neden BehaviorSubject?**:
- ✅ Başlangıç değeri olur
- ✅ Mevcut değere `.value` ile erişilebilir
- ✅ Yeni subscriber'lara son değer otomatik gönderilir
- ✅ Reactive (değişim anında tüm dinleyiciler haberdar olur)

---

### 3. Persistent State (Kalıcı State - LocalStorage)

**Nedir?**: Tarayıcı kapansa bile korunan state.

**Nasıl Yapılıyor?**: **LocalStorage** kullanılıyor.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  
  // Token'ı kaydet
  private setToken(token: string): void {
    localStorage.setItem('token', token);
    this.isLoggedInSubject.next(true);
  }
  
  // Token'ı oku
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  // Token'ı sil
  private removeToken(): void {
    localStorage.removeItem('token');
    this.isLoggedInSubject.next(false);
  }
  
  // İşletme bilgisini kaydet (JSON)
  private setStoredIsletme(isletme: Isletme): void {
    localStorage.setItem('isletme', JSON.stringify(isletme));
    this.currentIsletmeSubject.next(isletme);
  }
  
  // İşletme bilgisini oku
  private getStoredIsletme(): Isletme | null {
    const data = localStorage.getItem('isletme');
    return data ? JSON.parse(data) : null;
  }
}
```

**Sayfa Yenileme Sonrası State Geri Yükleme**:
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  
  // Constructor'da LocalStorage'dan state'i geri yükle
  private isLoggedInSubject = new BehaviorSubject<boolean>(
    this.hasToken()  // LocalStorage'da token var mı kontrol et
  );
  
  private currentIsletmeSubject = new BehaviorSubject<Isletme | null>(
    this.getStoredIsletme()  // LocalStorage'dan işletme bilgisini al
  );
}
```

**Ne Zaman Kullanılır?**:
- Authentication token
- Kullanıcı oturum bilgileri
- Kullanıcı tercihleri (dark mode, dil seçimi)

---

## 🏗️ Önemli Mimari Yapılar

### 1. Layered Architecture (Katmanlı Mimari)

Proje **3 ana katmandan** oluşur:

```
┌─────────────────────────────────┐
│   PRESENTATION LAYER            │  ← Components (UI)
│   (AnasayfaComponent, etc.)     │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   SERVICE LAYER                 │  ← Business Logic
│   (AuthService, IsletmeService) │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   CORE LAYER                    │  ← Infrastructure
│   (Interceptors, Guards)        │
└────────────┬────────────────────┘
             │
             ▼
        BACKEND API
```

#### Presentation Layer (Sunum Katmanı)
**Konum**: `src/app/*/component.ts`

**Görevleri**:
- UI render etme
- Kullanıcı etkileşimlerini yakalama
- Servisleri çağırma
- Component-level state yönetimi

**Örnek**:
```typescript
export class AnasayfaComponent {
  isletmeler: Isletme[] = [];
  yukleniyor = true;
  
  constructor(private isletmeService: IsletmeService) {}
  
  ngOnInit() {
    this.isletmeleriYukle();
  }
  
  isletmeleriYukle() {
    this.isletmeService.getIsletmeler().subscribe({
      next: (data) => {
        this.isletmeler = data;
        this.yukleniyor = false;
      }
    });
  }
}
```

#### Service Layer (Servis Katmanı)
**Konum**: `src/app/services/`

**Görevleri**:
- HTTP API çağrıları
- İş mantığı (business logic)
- State yönetimi (BehaviorSubject)
- Data transformation

**Örnek**:
```typescript
@Injectable({ providedIn: 'root' })
export class IsletmeService {
  private apiUrl = environment.apiBaseUrl;
  
  getIsletmeler(): Observable<Isletme[]> {
    return this.http.get<Isletme[]>(`${this.apiUrl}/isletmeler`);
  }
  
  randevuAl(randevu: Randevu): Observable<Randevu> {
    return this.http.post<Randevu>(`${this.apiUrl}/randevular`, randevu);
  }
}
```

#### Core Layer (Çekirdek Katman)
**Konum**: `src/app/core/`

**Görevleri**:
- HTTP interceptors
- Route guards
- Global error handling
- Singleton servisler

**Örnek**:
```typescript
@Injectable()
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

### 2. Design Patterns (Tasarım Desenleri)

#### a) Dependency Injection (DI) Pattern

**Nedir?**: Angular'ın built-in DI sistemi kullanılır.

**Nasıl?**:
```typescript
// Servis tanımla
@Injectable({ providedIn: 'root' })
export class AuthService { }

// Component'e inject et
export class LoginComponent {
  constructor(private authService: AuthService) {}
}
```

**Faydaları**:
- ✅ Loose coupling (gevşek bağlılık)
- ✅ Test edilebilirlik (mock servisler kullanılabilir)
- ✅ Singleton pattern (tek instance)

---

#### b) Observable Pattern (Reactive Programming)

**Nedir?**: **RxJS** ile asenkron veri akışı yönetimi.

**Nasıl?**:
```typescript
// Servis Observable döndürür
getIsletmeler(): Observable<Isletme[]> {
  return this.http.get<Isletme[]>('/api/isletmeler');
}

// Component subscribe olur
this.service.getIsletmeler().subscribe({
  next: (data) => this.isletmeler = data,
  error: (err) => console.error(err)
});
```

**Operators Kullanımı**:
```typescript
this.http.get('/api/data').pipe(
  tap(data => console.log('Data received:', data)),
  map(data => data.items),
  catchError(err => this.handleError(err))
).subscribe();
```

---

#### c) Interceptor Pattern

**Nedir?**: HTTP isteklerini merkezi olarak yakalama ve işleme.

**Projede Kullanılan Interceptor'lar**:

1. **AuthInterceptor**: Her isteğe JWT token ekler
2. **ErrorInterceptor**: Hataları merkezi olarak yakalar

**Nasıl Çalışır?**:
```
Component HTTP İsteği
      ↓
AuthInterceptor (Token ekle)
      ↓
Backend API
      ↓
ErrorInterceptor (Hata yakala)
      ↓
Component Response/Error
```

**Kod**:
```typescript
// app.module.ts
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
]
```

---

#### d) Singleton Pattern

**Nedir?**: Servislerin tek bir instance'ı olur.

**Nasıl?**:
```typescript
@Injectable({
  providedIn: 'root'  // Singleton olarak root seviyede
})
export class AuthService { }
```

**Faydaları**:
- ✅ Memory efficiency
- ✅ Global state yönetimi
- ✅ Tutarlı veri

---

#### e) Repository Pattern (Implicit - Örtük)

**Nedir?**: Servis katmanı, backend ile etkileşimi soyutlar.

**Nasıl?**:
```typescript
// IsletmeService bir repository gibi davranır
export class IsletmeService {
  getIsletmeler(): Observable<Isletme[]> { }
  getIsletme(id: number): Observable<Isletme> { }
  createIsletme(data: Partial<Isletme>): Observable<Isletme> { }
  updateIsletme(id: number, data: Partial<Isletme>): Observable<Isletme> { }
  deleteIsletme(id: number): Observable<void> { }
}
```

**Faydaları**:
- ✅ Backend değişikliği component'i etkilemez
- ✅ Test edilebilirlik
- ✅ Kod organizasyonu

---

## 🔄 Veri Akışı (Data Flow)

### Tipik Bir Kullanıcı İşlemi:

```
1. KULLANICI GİRİŞİ YAPAR
   ↓
2. LoginComponent.onLogin()
   ↓
3. AuthService.login(telefon, parola)
   ↓
4. AuthInterceptor (Token yok, pas geç)
   ↓
5. HTTP POST → Backend API
   ↓
6. Response: { token, isletme }
   ↓
7. .pipe(tap()) içinde:
   - localStorage.setItem('token', token)
   - isLoggedInSubject.next(true)
   - currentIsletmeSubject.next(isletme)
   ↓
8. Component.subscribe() içinde:
   - loading = false
   - router.navigate('/isletme-panel')
   ↓
9. TÜM UYGULAMADA:
   - isLoggedIn$ → true oldu
   - Navbar güncellendi
   - Protected routes erişilebilir oldu
```

---

## 📦 Proje Klasör Yapısı ve Sorumluluklar

```
src/app/
│
├── core/                          # Singleton, global servisler
│   └── http/
│       ├── auth.interceptor.ts    # JWT token ekleme
│       └── error.interceptor.ts   # Global hata yakalama
│
├── services/                      # Business logic servisleri
│   ├── auth.service.ts            # Kimlik doğrulama + state
│   ├── isletme.service.ts         # İşletme CRUD operasyonları
│   └── sorulama-servisi.service.ts
│
├── anasayfa/                      # Feature: Ana sayfa
│   ├── anasayfa.component.ts      # Component logic
│   ├── anasayfa.component.html    # Template
│   ├── anasayfa.component.css     # Styles
│   └── randevu/                   # Alt component
│
├── login/                         # Feature: Giriş/Kayıt
│   ├── login.component.ts
│   └── ...
│
├── isletme-panel/                 # Feature: İşletme paneli
│   ├── isletme-panel.component.ts
│   └── ...
│
├── app-routing.module.ts          # Route tanımları
└── app.module.ts                  # Root modül
```

---

## 🎯 Neden Bu Mimari Seçildi?

### Avantajları:

1. **Separation of Concerns (SoC)**
   - Her katmanın belirli bir görevi var
   - Component sadece UI ile ilgileniyor
   - Servis sadece business logic ile ilgileniyor

2. **Maintainability (Sürdürülebilirlik)**
   - Kod organizasyonu açık ve net
   - Yeni özellik eklemek kolay
   - Hataları bulmak kolay

3. **Testability (Test Edilebilirlik)**
   - Servisler component'lerden bağımsız test edilebilir
   - DI sayesinde mock servisler kullanılabilir

4. **Scalability (Ölçeklenebilirlik)**
   - Lazy loading ile modüller ayrılabilir
   - State management kolayca ölçeklendirilebilir
   - Yeni özellikler mevcut yapıyı bozmaz

5. **Reusability (Yeniden Kullanılabilirlik)**
   - Servisler tüm uygulama genelinde kullanılabilir
   - Component'ler bağımsız ve yeniden kullanılabilir

---

## 🔐 Güvenlik Özellikleri

### 1. JWT Token Yönetimi
```typescript
// AuthInterceptor otomatik ekler
Authorization: Bearer {token}
```

### 2. Input Validasyonu
```typescript
private validatePhone(phone: string): boolean {
  const phoneRegex = /^(0)?5\d{9}$/;
  return phoneRegex.test(phone);
}
```

### 3. XSS Koruması
Angular otomatik olarak template'leri sanitize eder.

---

## 📈 Gelecek İyileştirmeler

1. **NgRx State Management**: Daha karmaşık state yönetimi için
2. **Lazy Loading**: Performans optimizasyonu
3. **Route Guards**: AuthGuard, RoleGuard eklenebilir
4. **Reactive Forms**: Daha güçlü form yönetimi
5. **PWA**: Offline support
6. **Unit Tests**: Daha kapsamlı test coverage

---

## 📚 Detaylı Dokümantasyon

Bu özet dokümandır. Daha detaylı bilgi için:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Mimari detayları
- **[STATE-MANAGEMENT.md](./STATE-MANAGEMENT.md)** - State management best practices
- **[DIAGRAMS.md](./DIAGRAMS.md)** - Görsel diyagramlar
- **[CODE-EXAMPLES.md](./CODE-EXAMPLES.md)** - Kod örnekleri
- **[QUICK-START.md](./QUICK-START.md)** - Hızlı başlangıç

---

## ✅ Özet

**State Management**:
- Component-level: Lokal state
- Service-level: BehaviorSubject (RxJS)
- Persistent: LocalStorage

**Önemli Mimariler**:
- Layered Architecture (3 katman)
- Design Patterns (DI, Observable, Interceptor, Singleton, Repository)
- Reactive Programming (RxJS)
- HTTP Interceptors (Auth, Error)

**Veri Akışı**:
Component → Service → Interceptor → Backend → Interceptor → Service → Component

Bu yapı **maintainable, testable, scalable** bir uygulama sağlar.

---

**Proje**: İşletme Randevu Sistemi Frontend  
**Framework**: Angular 14  
**Son Güncelleme**: 2 Ocak 2026
