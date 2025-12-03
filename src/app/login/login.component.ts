import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  isLoginMode = true;
  loading = false;

  loginError = '';
  loginSuccess = '';
  signupError = '';
  signupSuccess = '';

  loginTelefon = '';
  loginPassword = '';

  signupName = '';
  signupPhone = '';
  signupPassword = '';
  signupIl = '';
  signupIlce = '';
  signupMahalle = '';
  signupSokak = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  onLogin(): void {
    if (!this.loginTelefon || !this.loginPassword) {
      this.loginError = 'Lütfen tüm alanları doldurun';
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
    if (!this.signupName || !this.signupPassword) {
      this.signupError = 'Lütfen zorunlu alanları doldurun';
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
      telefon: this.signupPhone || undefined
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
    this.loginSuccess = '';
    this.signupError = '';
    this.signupSuccess = '';
  }
}
