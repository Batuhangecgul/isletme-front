# 🚀 Hızlı Başlangıç Kılavuzu - Mimari ve State Management

Bu doküman, projede yeni geliştiriciler için hızlı bir başlangıç rehberidir.

## 📚 Dokümantasyon Dizini

| Doküman | İçerik | Hedef Okuyucu |
|---------|--------|---------------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Genel mimari yapı, katmanlar, design patterns | Tüm geliştiriciler |
| **[STATE-MANAGEMENT.md](./STATE-MANAGEMENT.md)** | State management stratejileri ve best practices | Frontend geliştiriciler |
| **[DIAGRAMS.md](./DIAGRAMS.md)** | Görsel diyagramlar ve veri akış şemaları | Görsel öğrenenler |
| **[CODE-EXAMPLES.md](./CODE-EXAMPLES.md)** | Pratik kod örnekleri ve implementasyonlar | Aktif geliştiriciler |

---

## 🎯 Projeyi Anlamak İçin 5 Dakika

### 1. Mimari Genel Bakış (2 dakika)

```
┌─────────────────────────────────────┐
│         COMPONENTS                  │ ← Kullanıcı Arayüzü
│  (anasayfa, login, isletme-panel)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         SERVICES                    │ ← İş Mantığı
│  (AuthService, IsletmeService)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      INTERCEPTORS                   │ ← Global İşlevler
│  (Auth, Error Handling)            │
└──────────────┬──────────────────────┘
               │
               ▼
         BACKEND API
```

### 2. State Management (2 dakika)

**3 Ana State Yönetimi Var**:

```typescript
// 1. Component State (Lokal)
export class MyComponent {
  yukleniyor = true;        // UI state
  isletmeler: Isletme[] = []; // Data state
}

// 2. Service State (Global - RxJS)
@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
}

// 3. Persistent State (LocalStorage)
localStorage.setItem('token', token);
localStorage.getItem('token');
```

### 3. Dosya Nerede Oluşturulur? (1 dakika)

```
src/app/
├── components/          # Yeni component buraya
│   └── my-feature/
│       ├── my-feature.component.ts
│       ├── my-feature.component.html
│       └── my-feature.component.css
│
├── services/           # Yeni servis buraya
│   └── my-data.service.ts
│
└── core/
    ├── http/          # Yeni interceptor buraya
    ├── guards/        # Yeni guard buraya
    └── models/        # Yeni interface/model buraya
```

---

## 🔧 Yaygın Görevler - Kod Snippet'leri

### Yeni Bir Servis Oluşturma

```bash
ng generate service services/my-data
```

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MyData {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class MyDataService {
  private apiUrl = environment.apiBaseUrl;
  
  constructor(private http: HttpClient) { }
  
  getData(): Observable<MyData[]> {
    return this.http.get<MyData[]>(`${this.apiUrl}/my-data`);
  }
}
```

### Yeni Bir Component Oluşturma

```bash
ng generate component components/my-feature
```

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MyDataService, MyData } from '../../services/my-data.service';

@Component({
  selector: 'app-my-feature',
  templateUrl: './my-feature.component.html',
  styleUrls: ['./my-feature.component.css']
})
export class MyFeatureComponent implements OnInit, OnDestroy {
  
  // State
  data: MyData[] = [];
  loading = false;
  error: string | null = null;
  
  // Subscription management
  private destroy$ = new Subject<void>();
  
  constructor(private dataService: MyDataService) { }
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(): void {
    this.loading = true;
    this.error = null;
    
    this.dataService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.data = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Veri yüklenemedi';
          this.loading = false;
        }
      });
  }
}
```

### BehaviorSubject ile Shared State

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  
  // Private state
  private stateSubject = new BehaviorSubject<AppState>({
    user: null,
    theme: 'light'
  });
  
  // Public observable
  state$ = this.stateSubject.asObservable();
  
  // Getter
  get currentState(): AppState {
    return this.stateSubject.value;
  }
  
  // Update methods
  setUser(user: User | null): void {
    this.stateSubject.next({
      ...this.currentState,
      user
    });
  }
  
  setTheme(theme: 'light' | 'dark'): void {
    this.stateSubject.next({
      ...this.currentState,
      theme
    });
  }
}
```

### HTTP Interceptor Ekleme

```typescript
// 1. Interceptor oluştur
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class MyInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Do something with request
    const modifiedReq = req.clone({
      setHeaders: { 'X-Custom-Header': 'value' }
    });
    return next.handle(modifiedReq);
  }
}

// 2. app.module.ts'ye ekle
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: MyInterceptor, multi: true }
]
```

### Route Guard Ekleme

```typescript
// 1. Guard oluştur
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
  
  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

// 2. Route'a ekle
{
  path: 'protected',
  component: ProtectedComponent,
  canActivate: [AuthGuard]
}
```

---

## 🎨 Component Template Patterns

### Loading State

```html
<div *ngIf="loading" class="spinner">
  Yükleniyor...
</div>

<div *ngIf="!loading && !error">
  <!-- İçerik -->
</div>

<div *ngIf="error" class="error">
  {{ error }}
</div>
```

### List with Pagination

```html
<!-- Liste -->
<div *ngFor="let item of gosterilecekItems; trackBy: trackById">
  {{ item.name }}
</div>

<!-- Pagination -->
<div class="pagination">
  <button (click)="oncekiSayfa()" [disabled]="mevcutSayfa === 1">
    Önceki
  </button>
  
  <span>{{ mevcutSayfa }} / {{ toplamSayfa }}</span>
  
  <button (click)="sonrakiSayfa()" [disabled]="mevcutSayfa === toplamSayfa">
    Sonraki
  </button>
</div>
```

### Modal Pattern

```html
<div *ngIf="modalAcik" class="modal-overlay" (click)="modalKapat()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <button class="close-btn" (click)="modalKapat()">×</button>
    <!-- Modal içeriği -->
  </div>
</div>
```

---

## 🔍 Debugging Tips

### 1. State Değişimlerini İzleme

```typescript
// Component'te
ngOnInit() {
  this.service.data$.subscribe(data => {
    console.log('State changed:', data);
  });
}
```

### 2. HTTP İsteklerini İzleme

Chrome DevTools → Network tab
veya
LoggingInterceptor kullan (CODE-EXAMPLES.md'de var)

### 3. LocalStorage'ı Kontrol Etme

```typescript
// Console'da
localStorage.getItem('token')
localStorage.getItem('isletme')

// Veya DevTools → Application → Local Storage
```

---

## ⚠️ Yaygın Hatalar ve Çözümleri

### 1. Memory Leak (Subscription'ları Temizlememek)

```typescript
// ❌ Kötü
ngOnInit() {
  this.service.getData().subscribe(data => {
    this.data = data;
  });
}

// ✅ İyi
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 2. State'i Doğrudan Mutate Etmek

```typescript
// ❌ Kötü
this.items.push(newItem);
this.user.name = 'New Name';

// ✅ İyi
this.items = [...this.items, newItem];
this.user = { ...this.user, name: 'New Name' };
```

### 3. Error Handling Yapmamak

```typescript
// ❌ Kötü
this.service.getData().subscribe(data => {
  this.data = data;
});

// ✅ İyi
this.service.getData().subscribe({
  next: (data) => this.data = data,
  error: (err) => {
    console.error('Error:', err);
    this.error = 'Veri yüklenemedi';
  }
});
```

---

## 📖 Daha Fazla Bilgi

- **Mimari detayları**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **State management**: [STATE-MANAGEMENT.md](./STATE-MANAGEMENT.md)
- **Görsel diyagramlar**: [DIAGRAMS.md](./DIAGRAMS.md)
- **Kod örnekleri**: [CODE-EXAMPLES.md](./CODE-EXAMPLES.md)

- **Angular Docs**: https://angular.io/docs
- **RxJS Docs**: https://rxjs.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

## 🚀 Başlamaya Hazır mısınız?

1. Yukarıdaki dokümanları okuyun
2. Mevcut kodu inceleyin
3. Küçük bir özellik ekleyerek pratik yapın
4. Sorularınız varsa, ekip ile paylaşın!

**İyi Kodlamalar! 🎉**

---

**Son Güncelleme**: 2 Ocak 2026
