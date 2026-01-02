# 🔄 State Management Guide - İşletme Front

Bu doküman, **İşletme Randevu Sistemi** projesinde kullanılan state management (durum yönetimi) stratejilerini detaylı olarak açıklar.

## 📋 İçindekiler

1. [State Management Nedir?](#state-management-nedir)
2. [Projede Kullanılan Yaklaşımlar](#projede-kullanılan-yaklaşımlar)
3. [State Tipleri](#state-tipleri)
4. [BehaviorSubject ile State Yönetimi](#behaviorsubject-ile-state-yönetimi)
5. [LocalStorage ile Persistent State](#localstorage-ile-persistent-state)
6. [Reactive State Patterns](#reactive-state-patterns)
7. [Pratik Örnekler](#pratik-örnekler)
8. [Best Practices](#best-practices)

---

## 🤔 State Management Nedir?

**State (Durum)**, uygulamanın belirli bir andaki verilerini ve durumunu temsil eder. State management ise bu verilerin nasıl saklandığını, güncellendiğini ve bileşenler arasında nasıl paylaşıldığını yönetir.

### State Örnekleri:
- Kullanıcının giriş yapıp yapmadığı (`isLoggedIn`)
- Yüklü olan işletme listesi (`isletmeler`)
- Modal'ın açık veya kapalı olması (`modalAcik`)
- Form input değerleri (`loginTelefon`, `loginPassword`)
- Sayfa numarası (`mevcutSayfa`)

---

## 🎯 Projede Kullanılan Yaklaşımlar

Bu projede **3 ana state management stratejisi** kullanılmaktadır:

### 1. Component State (Lokal Durum)
Sadece bir component içinde kullanılan state.

### 2. Service State (Paylaşılan Durum)
Birden fazla component arasında paylaşılan state.

### 3. Persistent State (Kalıcı Durum)
Sayfa yenilense bile korunan state (LocalStorage).

---

## 📊 State Tipleri

### 1. UI State (Kullanıcı Arayüzü Durumu)

**Tanım**: Kullanıcı arayüzünün görsel durumunu kontrol eder.

**Örnekler**:
```typescript
export class AnasayfaComponent {
  // UI State
  yukleniyor = true;           // Loading indicator
  modalAcik = false;           // Modal açık mı?
  isDarkMode = false;          // Dark mode aktif mi?
  isSloganCollapsed = false;   // Slogan collapsed mi?
  sayfaHazir = false;          // Sayfa animasyonu için
}
```

**Kullanım**:
```html
<!-- Template'de kullanım -->
<div *ngIf="yukleniyor" class="spinner">Yükleniyor...</div>
<div *ngIf="!yukleniyor" class="content">...</div>

<div [class.dark-mode]="isDarkMode">...</div>
```

### 2. Data State (Veri Durumu)

**Tanım**: Backend'den gelen veya kullanıcı tarafından girilen veriler.

**Örnekler**:
```typescript
export class AnasayfaComponent {
  // Data State
  isletmeler: Isletme[] = [];
  filtrelenmisIsletmeler: Isletme[] = [];
  seciliIsletme: Isletme | null = null;
  seciliIsletmeCalisanlar: Calisan[] = [];
}
```

### 3. Form State (Form Durumu)

**Tanım**: Form input değerleri ve validasyon durumları.

**Örnekler**:
```typescript
export class LoginComponent {
  // Form State
  loginTelefon = '';
  loginPassword = '';
  signupName = '';
  signupPhone = '';
  signupPassword = '';
  
  // Validation State
  validation = {
    signupName: { touched: false, valid: false },
    signupPhone: { touched: false, valid: true },
    loginTelefon: { touched: false, valid: false }
  };
}
```

### 4. Navigation State (Navigasyon Durumu)

**Tanım**: Sayfalama ve navigasyon ile ilgili durumlar.

**Örnekler**:
```typescript
export class AnasayfaComponent {
  // Navigation State
  mevcutSayfa = 1;
  toplamSayfa = 1;
  sayfaBasinaIsletme = 20;
}
```

### 5. Application State (Uygulama Durumu)

**Tanım**: Uygulama genelinde paylaşılan global state.

**Örnekler**:
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Application State (Global)
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  private currentIsletmeSubject = new BehaviorSubject<Isletme | null>(null);
  currentIsletme$ = this.currentIsletmeSubject.asObservable();
}
```

---

## 🔄 BehaviorSubject ile State Yönetimi

**BehaviorSubject**, RxJS'in sunduğu özel bir Observable türüdür. State management için idealdir.

### BehaviorSubject Özellikleri:

1. **Initial Value**: Başlangıç değeri gerektirir
2. **Current Value**: `.value` ile mevcut değere erişim
3. **Multicast**: Birden fazla subscriber'a aynı değeri gönderir
4. **Last Value Emission**: Yeni subscriber'lara son değeri otomatik gönderir

### Neden BehaviorSubject?

```typescript
// ❌ Normal Observable - başlangıç değeri yok
private data$ = new Observable<string>();

// ✅ BehaviorSubject - başlangıç değeri var
private dataSubject = new BehaviorSubject<string>('initial');
data$ = this.dataSubject.asObservable();
```

### AuthService'te BehaviorSubject Kullanımı

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  
  // 1. Private BehaviorSubject (state container)
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  
  // 2. Public Observable (read-only stream)
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  // 3. State değiştirme (private metod)
  private setToken(token: string): void {
    localStorage.setItem('token', token);
    this.isLoggedInSubject.next(true);  // State güncelle
  }
  
  // 4. State okuma (getter)
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }
}
```

### Component'te BehaviorSubject Subscribe

```typescript
export class AppComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  private destroy$ = new Subject<void>();
  
  constructor(private authService: AuthService) {}
  
  ngOnInit() {
    // Subscribe to state changes
    this.authService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isLoggedIn = status;
        console.log('Login status changed:', status);
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Async Pipe ile Kullanım (Önerilen)

```typescript
// Component
export class AppComponent {
  isLoggedIn$ = this.authService.isLoggedIn$;
  
  constructor(private authService: AuthService) {}
}
```

```html
<!-- Template - async pipe otomatik subscribe/unsubscribe yapar -->
<div *ngIf="isLoggedIn$ | async">
  Hoşgeldiniz!
</div>
```

---

## 💾 LocalStorage ile Persistent State

LocalStorage, tarayıcı kapansa bile state'i korur. Session bilgileri ve kullanıcı tercihleri için kullanılır.

### AuthService'te LocalStorage Kullanımı

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token';
  private isletmeKey = 'isletme';
  
  // ========== TOKEN YÖNETİMİ ==========
  
  // Token kaydetme
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isLoggedInSubject.next(true);
  }
  
  // Token okuma
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
  
  // Token var mı kontrolü
  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
  
  // Token silme
  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.isletmeKey);
    this.isLoggedInSubject.next(false);
  }
  
  // ========== İŞLETME BİLGİSİ ==========
  
  // İşletme bilgisi kaydetme (JSON)
  private setStoredIsletme(isletme: Isletme): void {
    localStorage.setItem(this.isletmeKey, JSON.stringify(isletme));
    this.currentIsletmeSubject.next(isletme);
  }
  
  // İşletme bilgisi okuma (JSON parse)
  private getStoredIsletme(): Isletme | null {
    const data = localStorage.getItem(this.isletmeKey);
    return data ? JSON.parse(data) : null;
  }
}
```

### Dark Mode State'i LocalStorage'da

```typescript
export class AnasayfaComponent {
  isDarkMode = false;
  
  ngOnInit() {
    this.checkDarkMode();
  }
  
  // Sayfa yüklendiğinde localStorage'dan oku
  checkDarkMode(): void {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    }
  }
  
  // Dark mode toggle ve localStorage'a kaydet
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }
}
```

### LocalStorage Best Practices

✅ **DO**:
```typescript
// 1. Key'leri constant olarak tanımla
private readonly TOKEN_KEY = 'token';

// 2. Type-safe okuma/yazma için wrapper metodlar kullan
private getStoredData<T>(key: string): T | null {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

private setStoredData<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// 3. Error handling ekle
try {
  const data = JSON.parse(localStorage.getItem('key'));
} catch (error) {
  console.error('LocalStorage parse error:', error);
}
```

❌ **DON'T**:
```typescript
// Şifreleri localStorage'da SAKLAMAYIN!
localStorage.setItem('password', password); // ❌ Güvenlik riski

// Büyük veriyi localStorage'da SAKLAMAYIN!
localStorage.setItem('bigData', JSON.stringify(hugeArray)); // ❌ 5-10MB limit

// Hard-coded key'ler KULLANMAYIN!
localStorage.getItem('token'); // ❌ Magic string
```

---

## 🌊 Reactive State Patterns

### Pattern 1: Load-Subscribe-Display

```typescript
export class AnasayfaComponent implements OnInit {
  isletmeler: Isletme[] = [];
  yukleniyor = true;
  
  ngOnInit() {
    this.isletmeleriYukle();
  }
  
  isletmeleriYukle(): void {
    this.yukleniyor = true;
    
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

### Pattern 2: State Update with Side Effects

```typescript
export class AuthService {
  
  login(telefon: string, parola: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { telefon, parola })
      .pipe(
        tap(response => {
          // Side effect 1: Token'ı kaydet
          this.setToken(response.token);
          
          // Side effect 2: İşletme bilgisini kaydet
          this.setStoredIsletme(response.isletme);
          
          // Side effect 3: State'i güncelle
          this.isLoggedInSubject.next(true);
        })
      );
  }
}
```

### Pattern 3: Derived State (Türetilmiş State)

```typescript
export class AnasayfaComponent {
  isletmeler: Isletme[] = [];           // Ana state
  filtrelenmisIsletmeler: Isletme[] = []; // Derived state
  mevcutSayfa = 1;
  sayfaBasinaIsletme = 20;
  
  // Computed property (getter) - Vue'daki computed gibi
  get gosterilecekIsletmeler(): Isletme[] {
    const baslangic = (this.mevcutSayfa - 1) * this.sayfaBasinaIsletme;
    const bitis = baslangic + this.sayfaBasinaIsletme;
    return this.filtrelenmisIsletmeler.slice(baslangic, bitis);
  }
  
  // State değiştiğinde derived state'i güncelle
  ara(): void {
    const metin = this.aramaMetni.toLowerCase();
    
    // Ana state'ten derived state oluştur
    this.filtrelenmisIsletmeler = this.isletmeler.filter(isletme => {
      return isletme.isim.toLowerCase().includes(metin);
    });
    
    this.mevcutSayfa = 1; // Pagination'ı sıfırla
  }
}
```

### Pattern 4: Optimistic Update

```typescript
export class IsletmePanelComponent {
  randevular: Randevu[] = [];
  
  randevuOnayla(randevu: Randevu): void {
    // 1. Önce UI'ı güncelle (optimistic)
    const index = this.randevular.findIndex(r => r.id === randevu.id);
    if (index !== -1) {
      this.randevular[index] = { ...randevu, durum: 'onaylandi' };
    }
    
    // 2. Sonra API'ye gönder
    this.isletmeService.randevuOnayla(randevu.id).subscribe({
      next: (response) => {
        // Başarılı - UI zaten güncellendi
        console.log('Randevu onaylandı');
      },
      error: (err) => {
        // Hata durumunda geri al (rollback)
        this.randevular[index] = randevu;
        console.error('Randevu onaylanamadı:', err);
      }
    });
  }
}
```

---

## 💡 Pratik Örnekler

### Örnek 1: Modal State Yönetimi

```typescript
export class AnasayfaComponent {
  // Modal State
  modalAcik = false;
  seciliIsletme: Isletme | null = null;
  seciliIsletmeCalisanlar: Calisan[] = [];
  calisanlarYukleniyor = false;
  
  // Modal Aç
  detayGoster(isletme: Isletme): void {
    this.seciliIsletme = isletme;
    this.modalAcik = true;
    this.calisanlariYukle(isletme.id);
  }
  
  // Modal Kapat ve State Temizle
  modalKapat(): void {
    this.modalAcik = false;
    this.seciliIsletme = null;
    this.seciliIsletmeCalisanlar = [];
  }
  
  // Alt State Yükleme
  calisanlariYukle(isletmeId: number): void {
    this.calisanlarYukleniyor = true;
    
    this.isletmeService.getCalisanlar(isletmeId).subscribe({
      next: (data) => {
        this.seciliIsletmeCalisanlar = data;
        this.calisanlarYukleniyor = false;
      },
      error: (err) => {
        console.error('Çalışanlar yüklenemedi:', err);
        this.calisanlarYukleniyor = false;
      }
    });
  }
}
```

### Örnek 2: Form State ve Validasyon

```typescript
export class LoginComponent {
  // Form State
  loginTelefon = '';
  loginPassword = '';
  
  // Validation State
  validation = {
    loginTelefon: { touched: false, valid: false },
    loginPassword: { touched: false, valid: false }
  };
  
  // Error State
  loginError = '';
  loginPhoneError = '';
  
  // UI State
  loading = false;
  
  // Validasyon Trigger
  validateField(field: string): void {
    switch (field) {
      case 'loginTelefon':
        this.validation.loginTelefon.touched = true;
        this.validation.loginTelefon.valid = this.loginTelefon.trim().length > 0;
        break;
      case 'loginPassword':
        this.validation.loginPassword.touched = true;
        this.validation.loginPassword.valid = this.loginPassword.length > 0;
        break;
    }
  }
  
  // Form Submit
  onLogin(): void {
    // State'i güncelle
    this.loading = true;
    this.loginError = '';
    
    this.authService.login(this.loginTelefon, this.loginPassword).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/isletme-panel']);
      },
      error: (err) => {
        this.loading = false;
        this.loginError = err.message;
      }
    });
  }
}
```

### Örnek 3: Pagination State

```typescript
export class AnasayfaComponent {
  // Data State
  filtrelenmisIsletmeler: Isletme[] = [];
  
  // Pagination State
  mevcutSayfa = 1;
  toplamSayfa = 1;
  sayfaBasinaIsletme = 20;
  
  // Sayfa sayısını hesapla
  hesaplaSayfaSayisi(): void {
    this.toplamSayfa = Math.ceil(
      this.filtrelenmisIsletmeler.length / this.sayfaBasinaIsletme
    );
  }
  
  // Computed - gösterilecek öğeler
  get gosterilecekIsletmeler(): Isletme[] {
    const baslangic = (this.mevcutSayfa - 1) * this.sayfaBasinaIsletme;
    const bitis = baslangic + this.sayfaBasinaIsletme;
    return this.filtrelenmisIsletmeler.slice(baslangic, bitis);
  }
  
  // Sayfa değiştir
  sayfayaGit(sayfa: number): void {
    if (sayfa >= 1 && sayfa <= this.toplamSayfa) {
      this.mevcutSayfa = sayfa;
      this.scrollToResults();
    }
  }
  
  // Arama yapıldığında pagination'ı sıfırla
  ara(): void {
    // ... filtreleme logic
    this.mevcutSayfa = 1; // State reset
    this.hesaplaSayfaSayisi();
  }
}
```

---

## ✅ Best Practices

### 1. Immutability (Değişmezlik)

```typescript
// ❌ Kötü: Direct mutation
this.isletmeler.push(yeniIsletme);
this.isletme.isim = 'Yeni İsim';

// ✅ İyi: Immutable update
this.isletmeler = [...this.isletmeler, yeniIsletme];
this.isletme = { ...this.isletme, isim: 'Yeni İsim' };
```

### 2. Single Source of Truth

```typescript
// ✅ İyi: Tek bir kaynak
export class AnasayfaComponent {
  isletmeler: Isletme[] = [];  // SSOT
  
  get gosterilecekIsletmeler(): Isletme[] {
    return this.isletmeler.slice(0, 10);  // Türetilmiş
  }
}

// ❌ Kötü: Duplicate state
export class AnasayfaComponent {
  isletmeler: Isletme[] = [];
  gosterilecekIsletmeler: Isletme[] = [];  // Duplicate!
}
```

### 3. State Initialization

```typescript
// ✅ İyi: Anlamlı başlangıç değerleri
export class AnasayfaComponent {
  isletmeler: Isletme[] = [];       // Empty array
  yukleniyor = true;                // Loading state
  modalAcik = false;                // Closed by default
  seciliIsletme: Isletme | null = null;  // Nullable
}
```

### 4. State Cleanup

```typescript
// ✅ İyi: State temizliği
export class AnasayfaComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnInit() {
    this.service.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  modalKapat(): void {
    this.modalAcik = false;
    this.seciliIsletme = null;  // State cleanup
    this.seciliIsletmeCalisanlar = [];
  }
}
```

### 5. Error State Handling

```typescript
// ✅ İyi: Error state yönetimi
export class AnasayfaComponent {
  isletmeler: Isletme[] = [];
  yukleniyor = false;
  hata: string | null = null;
  
  isletmeleriYukle(): void {
    this.yukleniyor = true;
    this.hata = null;
    
    this.service.getIsletmeler().subscribe({
      next: (data) => {
        this.isletmeler = data;
        this.yukleniyor = false;
      },
      error: (err) => {
        this.hata = err.message;
        this.yukleniyor = false;
      }
    });
  }
}
```

---

## 🎓 State Management Anti-Patterns

### ❌ Anti-Pattern 1: God Component

```typescript
// Kötü: Component her şeyi yönetiyor
export class AppComponent {
  users: User[] = [];
  isletmeler: Isletme[] = [];
  randevular: Randevu[] = [];
  // ... 50+ state variable
}
```

**Çözüm**: State'i servislere taşı, component'e sadece UI state bırak.

### ❌ Anti-Pattern 2: Props Drilling

```typescript
// Kötü: State'i 5 seviye child'a props ile geçirmek
<grandparent [data]="data">
  <parent [data]="data">
    <child [data]="data">
      <grandchild [data]="data">
```

**Çözüm**: Service'te shared state kullan, BehaviorSubject ile paylaş.

### ❌ Anti-Pattern 3: Stale State

```typescript
// Kötü: Eski veriyi gösterme
this.isletmeler = cachedData;  // 1 saat önce alınmış veri
```

**Çözüm**: Cache invalidation stratejisi kullan, gerektiğinde refresh et.

---

## 📚 Özet

### State Management Stratejileri:

1. **Component State**: UI-specific local state
2. **Service State (BehaviorSubject)**: Shared application state
3. **LocalStorage**: Persistent state (token, preferences)

### Best Practices:

- ✅ Immutability prensiplerine uy
- ✅ Single Source of Truth (tek kaynak)
- ✅ Type-safe state (TypeScript interfaces)
- ✅ Error ve loading state'lerini yönet
- ✅ State cleanup (ngOnDestroy)
- ✅ Subscription'ları temizle

### Gelecek İyileştirmeler:

- NgRx (Redux pattern) veya Akita gibi advanced state management
- State normalization
- Time-travel debugging
- Optimistic updates
- Real-time state sync

---

**Son Güncelleme**: 2 Ocak 2026
**Proje**: İşletme Randevu Sistemi
**Framework**: Angular 14
