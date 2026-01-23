import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {

  isLoginMode = false; // false = Kayıt Ol, true = Giriş Yap / Çalışan Girişi
  calisanLoginMode = false; // Çalışan Girişi modu
  loading = false;
  pageReady = false;
  isDarkMode = false;

  // Şifre göster/gizle
  showLoginPassword = false;
  showSignupPassword = false;
  showCalisanPassword = false;

  // Şifre gücü
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthClass = '';

  loginError = '';
  loginSuccess = '';
  signupError = '';
  signupSuccess = '';
  calisanLoginError = '';
  calisanLoginSuccess = '';

  loginTelefon = '';
  loginPassword = '';
  loginPhoneError = '';

  // Çalışan Girişi
  calisanEmail = '';
  calisanPassword = '';

  signupName = '';
  signupPhone = '';
  signupPassword = '';
  signupPhoneError = '';
  signupIl = '';
  signupIlce = '';
  signupMahalle = '';
  signupSokak = '';

  // Validasyon durumları
  validation = {
    signupName: { touched: false, valid: false },
    signupPhone: { touched: false, valid: true },
    signupPassword: { touched: false, valid: false },
    loginTelefon: { touched: false, valid: false },
    loginPassword: { touched: false, valid: false },
    calisanEmail: { touched: false, valid: false },
    calisanPassword: { touched: false, valid: false }
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkDarkMode();
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
    setTimeout(() => {
      this.pageReady = true;
    }, 100);
  }

  checkDarkMode(): void {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      document.body.classList.add('dark-mode');
      this.isDarkMode = true;
    } else {
      document.body.classList.remove('dark-mode');
      this.isDarkMode = false;
    }
  }

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

  // Sadece rakam giriş engelleme
  onlyNumbers(event: KeyboardEvent): void {
    const char = String.fromCharCode(event.which);
    if (!/[0-9]/.test(char)) {
      event.preventDefault();
    }
  }
  onPhoneInput(field: string, event: any): void {
    const input = event.target.value;
    let cleaned = input.replace(/\D/g, ''); 
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length > 10) {
      cleaned = cleaned.substring(0, 10);
    }

    if (field === 'signupPhone') {
      this.signupPhone = cleaned;
    } else if (field === 'loginTelefon') {
      this.loginTelefon = cleaned;
    }

    this.validateField(field);
  }

  // Şifre göster/gizle toggle
  togglePasswordVisibility(field: 'login' | 'signup'): void {
    if (field === 'login') {
      this.showLoginPassword = !this.showLoginPassword;
    } else {
      this.showSignupPassword = !this.showSignupPassword;
    }
  }

  // Şifre gücü hesaplama
  checkPasswordStrength(): void {
    const password = this.signupPassword;
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    this.passwordStrength = strength;

    if (strength === 0) {
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';
    } else if (strength <= 2) {
      this.passwordStrengthText = 'Zayıf';
      this.passwordStrengthClass = 'weak';
    } else if (strength <= 3) {
      this.passwordStrengthText = 'Orta';
      this.passwordStrengthClass = 'medium';
    } else {
      this.passwordStrengthText = 'Güçlü';
      this.passwordStrengthClass = 'strong';
    }

    this.validation.signupPassword.valid = password.length >= 6;
  }

  // Input validasyonları
  validateField(field: string): void {
    switch (field) {
      case 'signupName':
        this.validation.signupName.touched = true;
        this.validation.signupName.valid = this.signupName.trim().length >= 2;
        break;
      case 'signupPhone':
        this.validation.signupPhone.touched = true;
        this.validation.signupPhone.valid = !this.signupPhone || /^[0-9]{10,11}$/.test(this.signupPhone.replace(/\s/g, ''));
        break;
      case 'signupPassword':
        this.validation.signupPassword.touched = true;
        this.checkPasswordStrength();
        break;
      case 'loginTelefon':
        this.validation.loginTelefon.touched = true;
        this.validation.loginTelefon.valid = this.loginTelefon.length === 10 && /^5\d{9}$/.test(this.loginTelefon);
        break;
      case 'signupPhone':
        this.validation.signupPhone.touched = true;
        this.validation.signupPhone.valid = this.signupPhone.length === 10 && /^5\d{9}$/.test(this.signupPhone);
        break;
      case 'loginPassword':
        this.validation.loginPassword.touched = true;
        this.validation.loginPassword.valid = this.loginPassword.length > 0;
        break;
    }
  }

  // Türkiye telefon formatı doğrulama (5xxxxxxxxx - 10 haneli)
  private validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, ''); // Tüm sayı-olmayan karakterleri sil
    const phoneRegex = /^5\d{9}$/; // 5xxxxxxxxx (10 haneli)
    return phoneRegex.test(cleaned);
  }

  onLogin(): void {
    this.loginPhoneError = '';
    if (!this.loginTelefon || !this.loginPassword) {
      this.loginError = 'Lütfen tüm alanları doldurun';
      return;
    }
    if (!this.validatePhone(this.loginTelefon)) {
      this.loginPhoneError = 'Geçerli bir Türkiye telefon numarası girin (5xxxxxxxxxx)';
      return;
    }

    this.loading = true;
    this.loginError = '';

    this.authService.login(this.loginTelefon, this.loginPassword).subscribe({
      next: (response: any) => {
        this.loading = false;

        let isletmeId = null;

        if (response.isletme?.isletme_id) {
          isletmeId = response.isletme.isletme_id;
        } else if (response.isletme?.id) {
          isletmeId = response.isletme.id;
        } else if (response.data?.id) {
          isletmeId = response.data.id;
        } else if (response.id) {
          isletmeId = response.id;
        }

        this.router.navigate(['/isletme-panel', isletmeId || 1]);
      },
      error: (err) => {
        this.loading = false;
        this.loginError = err.error?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      }
    });
  }

  // Çalışan Girişi
  onCalisanLogin(): void {
    if (!this.calisanEmail || !this.calisanPassword) {
      this.calisanLoginError = 'Lütfen e-mail ve şifre girin';
      return;
    }

    this.loading = true;
    this.calisanLoginError = '';

    this.authService.calisanLogin(this.calisanEmail, this.calisanPassword).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.calisanLoginSuccess = 'Giriş başarılı!';
        
        // Çalışan bilgisini localStorage'a kaydet
        if (response.calisan) {
          localStorage.setItem('calisan', JSON.stringify(response.calisan));
        }

        setTimeout(() => {
          this.router.navigate(['/calisan-panel']);
        }, 1000);
      },
      error: (err) => {
        this.loading = false;
        this.calisanLoginError = err.error?.message || 'Giriş başarısız. E-mail ve şifrenizi kontrol edin.';
        console.error('Çalışan login hatası:', err);
      }
    });
  }

  onSignup(): void {
    this.signupPhoneError = '';
    if (!this.signupName || !this.signupPassword || !this.signupPhone) {
      this.signupError = 'İsim, telefon ve şifre zorunludur';
      return;
    }
    if (!this.validatePhone(this.signupPhone)) {
      this.signupPhoneError = 'Geçerli bir Türkiye telefon numarası girin (5xxxxxxxxxx)';
      return;
    }

    if (this.signupPassword.length < 6) {
      this.signupError = 'Şifre en az 6 karakter olmalıdır';
      return;
    }

    this.loading = true;
    this.signupError = '';

    const signupData: any = {
      isim: this.signupName,
      parola: this.signupPassword,
      telefon: this.signupPhone
    };
    // Adres alanlarını birleştirerek tek string olarak gönder: il-ilce-mahalle-sokak
    if (this.signupIl || this.signupIlce || this.signupMahalle || this.signupSokak) {
      signupData.adres = `${this.signupIl}-${this.signupIlce}-${this.signupMahalle}-${this.signupSokak}`;
    }

    this.authService.signup(signupData).subscribe({
      next: (response) => {
        this.loading = false;
        this.isLoginMode = true;
        this.signupError = '';
        this.loginSuccess = 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.';
        this.loginTelefon = this.signupPhone || '';
        this.loginPassword = '';
        this.signupName = '';
        this.signupPhone = '';
        this.signupPassword = '';
        this.signupIl = '';
        this.signupIlce = '';
        this.signupMahalle = '';
        this.signupSokak = '';
        setTimeout(() => {
          this.loginSuccess = '';
        }, 5000);
      },
      error: (err) => {
        this.loading = false;
        this.signupError = err.error?.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.';
        console.error('Signup hatası:', err);
      }
    });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.loginError = '';
    this.loginPhoneError = '';
    this.loginSuccess = '';
    this.signupError = '';
    this.signupPhoneError = '';
    this.signupSuccess = '';
  }
}
