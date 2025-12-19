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

  isLoginMode = false; // false = Kayıt Ol, true = Giriş Yap
  loading = false;
  pageReady = false;
  isDarkMode = false;

  // Şifre göster/gizle
  showLoginPassword = false;
  showSignupPassword = false;

  // Şifre gücü
  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthClass = '';

  loginError = '';
  loginSuccess = '';
  signupError = '';
  signupSuccess = '';

  loginTelefon = '';
  loginPassword = '';
  loginPhoneError = '';

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
    loginPassword: { touched: false, valid: false }
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
        this.validation.loginTelefon.valid = this.loginTelefon.trim().length > 0;
        break;
      case 'loginPassword':
        this.validation.loginPassword.touched = true;
        this.validation.loginPassword.valid = this.loginPassword.length > 0;
        break;
    }
  }

  // Türkiye telefon formatı doğrulama (05xxxxxxxxx veya 5xxxxxxxxx)
  private validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, ''); // Tüm sayı-olmayan karakterleri sil
    const phoneRegex = /^(0)?5\d{9}$/; // 05xxxxxxxxx veya 5xxxxxxxxx
    return phoneRegex.test(cleaned);
  }

  onLogin(): void {
    this.loginPhoneError = '';
    if (!this.loginTelefon || !this.loginPassword) {
      this.loginError = 'Lütfen tüm alanları doldurun';
      return;
    }
    if (!this.validatePhone(this.loginTelefon)) {
      this.loginPhoneError = 'Geçerli bir Türkiye telefon numarası girin (05xxxxxxxxx)';
      return;
    }

    this.loading = true;
    this.loginError = '';

    this.authService.login(this.loginTelefon, this.loginPassword).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Giriş başarılı - Full response:', response);

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

        console.log('Bulunan İşletme ID:', isletmeId);

        this.router.navigate(['/isletme-panel', isletmeId || 1]);
      },
      error: (err) => {
        this.loading = false;
        this.loginError = err.error?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
        console.error('Login hatası:', err);
        console.error('Error body:', err.error);
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
      this.signupPhoneError = 'Geçerli bir Türkiye telefon numarası girin (05xxxxxxxxx)';
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
        console.log('Kayıt başarılı:', response);
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
