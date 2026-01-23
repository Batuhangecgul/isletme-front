import { Component, OnInit } from '@angular/core';
import { SorulamaServisiService } from '../../../services/sorulama-servisi.service';

@Component({
  selector: 'app-randevu-sorgulama',
  templateUrl: './randevu-sorgulama.component.html',
  styleUrls: ['./randevu-sorgulama.component.css']
})
export class RandevuSorgulamaComponent implements OnInit {
  aramaMetni: string = '';
  yukleniyor: boolean = false;
  randevular: any[] = [];
  hataMesaji: string = '';

  constructor(private sorgulamaServisi: SorulamaServisiService) { }

  ngOnInit(): void {}

  // Sadece sayı girişi kontrol
  onlyNumbers(event: KeyboardEvent): void {
    const char = String.fromCharCode(event.which);
    if (!/[0-9]/.test(char)) {
      event.preventDefault();
    }
  }

  // Telefon numarası doğrulama
  validatePhoneNumber(): void {
    if (this.aramaMetni.trim() === '') {
      this.hataMesaji = 'Telefon numarası boş olamaz!';
    } else if (this.aramaMetni.length < 10) {
      this.hataMesaji = 'Telefon numarası en az 10 karakter olmalıdır!';
    } else {
      this.hataMesaji = '';
    }
  }

  ara(): void {
    // Boş giriş kontrol et
    if (this.aramaMetni.trim() === '') {
      this.hataMesaji = 'Lütfen telefon numarası giriniz!';
      return;
    }
    this.yukleniyor = true;
    this.randevular = [];
    this.hataMesaji = '';
    this.sorgulamaServisi.randevuSorgula(this.aramaMetni).subscribe({
      next: (res: { randevular?: any[]; message?: string }) => {
        this.yukleniyor = false;
        if (res.randevular && res.randevular.length > 0) {
          this.randevular = res.randevular;
        } else if (res.message) {
          this.hataMesaji = res.message;
        } else {
          this.hataMesaji = 'Bir hata oluştu.';
        }
      },
      error: () => {
        this.yukleniyor = false;
        this.hataMesaji = 'Randevu bulunamadı.';
      }
    });
  }
}
