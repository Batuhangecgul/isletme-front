import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, Isletme } from '../services/auth.service';
import { IsletmeService, Calisan, Randevu } from '../services/isletme.service';

@Component({
  selector: 'app-isletme-panel',
  templateUrl: './isletme-panel.component.html',
  styleUrls: ['./isletme-panel.component.css']
})
export class IsletmePanelComponent implements OnInit {

  isletmeId: number | null = null;
  isletme: Isletme | null = null;
  isDarkMode = false;

  // Çalışanlar
  calisanlar: Calisan[] = [];
  showParola = false; // Parola göster/gizle
  yeniCalisan = {
    ad: '',
    soyad: '',
    parola: '',
    baslangic_saati: '09:00',
    bitis_saati: '18:00'
  };
  calisanFormAcik = false;

  // Çalışan düzenleme
  calisanDuzenlemeModu = false;
  duzenlenenCalisan: Calisan | null = null;
  calisanDuzenlemeVerisi = {
    ad: '',
    soyad: '',
    parola: '',
    baslangic_saati: '',
    bitis_saati: ''
  };

  // Randevular
  randevular: Randevu[] = [];
  seciliDurum = '';
  seciliTarih = '';
  seciliRandevu: Randevu | null = null;
  detayModalAcik = false;

  // Tab yönetimi
  aktifTab: 'genel' | 'calisanlar' | 'randevular' = 'genel';

  // Düzenleme modu
  duzenlemeModu = false;
  duzenlemeVerisi = {
    isim: '',
    telefon: '',
    adres: '',
    kategori: '',
    parola: '',
    zaman_artisi: 30
  };

  // Fotoğraf yükleme
  selectedFile: File | null = null;
  fotografYukleniyor = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private isletmeService: IsletmeService
  ) { }

  ngOnInit(): void {
    this.checkDarkMode();
    this.route.params.subscribe(params => {
      this.isletmeId = +params['id'];
      this.verileriYukle();
    });

    this.isletme = this.authService.getCurrentIsletme();
  }

  checkDarkMode(): void {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    } else {
      this.isDarkMode = false;
      document.body.classList.remove('dark-mode');
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

  verileriYukle(): void {
    if (this.isletmeId) {
      this.calisanlariYukle();
      this.randevulariYukle();
    }
  }

  // ==================== ÇALIŞAN İŞLEMLERİ ====================

  calisanlariYukle(): void {
    if (!this.isletmeId) return;
    this.isletmeService.getCalisanlar(this.isletmeId).subscribe({
      next: (data: any) => {
        this.calisanlar = Array.isArray(data) ? data : (data.data || data.calisanlar || []);
      },
      error: (err) => console.error('Çalışanlar yüklenemedi:', err)
    });
  }

  calisanEkle(): void {
    if (!this.isletmeId || !this.yeniCalisan.ad || !this.yeniCalisan.parola) {
      alert('Lütfen ad ve parola alanlarını doldurun');
      return;
    }

    // Email otomatik oluştur
    const email = (this.yeniCalisan.ad.toLowerCase() + this.yeniCalisan.soyad.toLowerCase()).replace(/\s+/g, '') + '@' + this.isletme?.isim?.toLowerCase().replace(/\s+/g, '');

    const calisan = {
      ad: this.yeniCalisan.ad,
      soyad: this.yeniCalisan.soyad || '-',
      email: email,
      parola: this.yeniCalisan.parola,
      baslangic_saati: this.yeniCalisan.baslangic_saati + ':00',
      bitis_saati: this.yeniCalisan.bitis_saati + ':00',
      isletme_id: this.isletmeId
    };

    this.isletmeService.calisanEkle(calisan).subscribe({
      next: (response) => {
        this.calisanlariYukle();
        this.calisanFormAcik = false;
        this.yeniCalisan = { ad: '', soyad: '', parola: '', baslangic_saati: '09:00', bitis_saati: '18:00' };
      },
      error: (err) => console.error('Çalışan eklenemedi:', err)
    });
  }

  calisanSil(calisan: Calisan): void {
    if (!this.isletmeId) return;

    const calisanId = calisan.id || (calisan as any).calisan_id;
    if (!calisanId) {
      return;
    }

    if (!confirm(`${calisan.ad} ${calisan.soyad} isimli çalışanı silmek istediğinize emin misiniz?`)) {
      return;
    }

    this.isletmeService.calisanSil(this.isletmeId, calisanId).subscribe({
      next: () => {
        this.calisanlariYukle();
      },
      error: (err) => console.error('Çalışan silinemedi:', err)
    });
  }

  calisanDuzenle(calisan: Calisan): void {
    this.duzenlenenCalisan = calisan;
    this.calisanDuzenlemeVerisi = {
      ad: calisan.ad,
      soyad: calisan.soyad,
      parola: '',
      baslangic_saati: calisan.baslangic_saati?.substring(0, 5) || '09:00',
      bitis_saati: calisan.bitis_saati?.substring(0, 5) || '18:00'
    };
    this.calisanDuzenlemeModu = true;
    this.calisanFormAcik = false;
  }

  calisanDuzenlemeIptal(): void {
    this.calisanDuzenlemeModu = false;
    this.duzenlenenCalisan = null;
    this.calisanDuzenlemeVerisi = { ad: '', soyad: '', parola: '', baslangic_saati: '', bitis_saati: '' };
  }

  calisanGuncelle(): void {
    if (!this.isletmeId || !this.duzenlenenCalisan) return;

    const calisanId = this.duzenlenenCalisan.id || (this.duzenlenenCalisan as any).calisan_id;
    if (!calisanId) {
      return;
    }

    const guncelVeri: any = {
      ad: this.calisanDuzenlemeVerisi.ad,
      soyad: this.calisanDuzenlemeVerisi.soyad,
      baslangic_saati: this.calisanDuzenlemeVerisi.baslangic_saati + ':00',
      bitis_saati: this.calisanDuzenlemeVerisi.bitis_saati + ':00'
    };

    // Parola dolduysa gönder
    if (this.calisanDuzenlemeVerisi.parola) {
      guncelVeri.parola = this.calisanDuzenlemeVerisi.parola;
    }

    this.isletmeService.calisanGuncelle(this.isletmeId, calisanId, guncelVeri).subscribe({
      next: () => {
        this.calisanlariYukle();
        this.calisanDuzenlemeIptal();
      },
      error: (err) => console.error('Çalışan güncellenemedi:', err)
    });
  }

  // ==================== RANDEVU İŞLEMLERİ ====================

  randevulariYukle(): void {
    if (!this.isletmeId) return;
    this.isletmeService.getRandevular(this.isletmeId, this.seciliDurum, this.seciliTarih).subscribe({
      next: (data: any) => {
        this.randevular = Array.isArray(data) ? data : (data.data || data.randevular || []);
      },
      error: (err) => console.error('Randevular yüklenemedi:', err)
    });
  }

  randevuOnayla(randevuId: number | undefined): void {
    if (!randevuId) {
      return;
    }
    this.isletmeService.randevuGuncelle(randevuId, 'onaylandi').subscribe({
      next: () => {
        this.randevulariYukle();
      },
      error: (err) => console.error('Randevu onaylanamadı:', err)
    });
  }

  randevuIptal(randevuId: number | undefined): void {
    if (!randevuId) {
      return;
    }
    this.isletmeService.randevuGuncelle(randevuId, 'iptal').subscribe({
      next: () => {
        this.randevulariYukle();
      },
      error: (err) => console.error('Randevu iptal edilemedi:', err)
    });
  }

  randevuBeklemedeYap(randevuId: number | undefined): void {
    if (!randevuId) {
      return;
    }
    this.isletmeService.randevuGuncelle(randevuId, 'beklemede').subscribe({
      next: () => {
        this.randevulariYukle();
      },
      error: (err) => console.error('Randevu beklemeye alınamadı:', err)
    });
  }

  randevuSil(randevuId: number | undefined): void {
    if (!randevuId) {
      return;
    }
    this.isletmeService.randevuSil(randevuId).subscribe({
      next: () => {
        this.randevulariYukle();
      },
      error: (err) => console.error('Randevu silinemedi:', err)
    });
  }

  // ==================== YARDIMCI METODLAR ====================

  getFotoUrl(): string | null {
    if ((this.isletme as any)?.fotograf_url) {
      return (this.isletme as any).fotograf_url;
    }
    return null;
  }

  getCalisanAdi(calisanId: number): string {
    // Önce id ile ara, sonra calisan_id ile ara
    const calisan = this.calisanlar.find(c => c.id === calisanId || (c as any).calisan_id === calisanId);
    return calisan ? `${calisan.ad} ${calisan.soyad}` : 'Bilinmiyor';
  }

  formatRandevuTarih(randevu: Randevu): string {
    // baslangic_zamani varsa onu kullan (örn: "2025-11-30 09:00:00")
    if (randevu.baslangic_zamani) {
      const parts = randevu.baslangic_zamani.split(' ');
      const tarih = parts[0]; // "2025-11-30"
      const saat = parts[1]?.substring(0, 5) || ''; // "09:00"
      return `${tarih} - ${saat}`;
    }
    // Yoksa eski format (tarih + saat)
    return `${randevu.tarih || ''} - ${randevu.saat || ''}`;
  }

  randevuGecmisMi(randevu: Randevu): boolean {
    const simdi = new Date();
    let randevuTarihi: Date;

    if (randevu.baslangic_zamani) {
      randevuTarihi = new Date(randevu.baslangic_zamani);
    } else if (randevu.tarih && randevu.saat) {
      randevuTarihi = new Date(`${randevu.tarih}T${randevu.saat}`);
    } else {
      return false;
    }

    return randevuTarihi < simdi;
  }

  // ==================== İŞLETME GÜNCELLEME ====================

  duzenlemeyiBaslat(): void {
    if (this.isletme) {
      this.duzenlemeVerisi = {
        isim: this.isletme.isim || '',
        telefon: this.isletme.telefon || '',
        adres: this.isletme.adres || '',
        kategori: this.isletme.kategori || '',
        parola: '',
        zaman_artisi: this.isletme.zaman_artisi || 30
      };
      this.duzenlemeModu = true;
    }
  }

  duzenlemeyiIptal(): void {
    this.duzenlemeModu = false;
  }

  isletmeyiGuncelle(): void {
    // Sadece dolu alanları gönder
    const guncellenecek: any = {};

    if (this.duzenlemeVerisi.isim && this.duzenlemeVerisi.isim !== this.isletme?.isim) {
      guncellenecek.isim = this.duzenlemeVerisi.isim;
    }
    if (this.duzenlemeVerisi.telefon && this.duzenlemeVerisi.telefon !== this.isletme?.telefon) {
      guncellenecek.telefon = this.duzenlemeVerisi.telefon;
    }
    if (this.duzenlemeVerisi.adres && this.duzenlemeVerisi.adres !== this.isletme?.adres) {
      guncellenecek.adres = this.duzenlemeVerisi.adres;
    }
    if (this.duzenlemeVerisi.kategori && this.duzenlemeVerisi.kategori !== this.isletme?.kategori) {
      guncellenecek.kategori = this.duzenlemeVerisi.kategori;
    }
    if (this.duzenlemeVerisi.parola && this.duzenlemeVerisi.parola.length >= 6) {
      guncellenecek.parola = this.duzenlemeVerisi.parola;
    }
    if (this.duzenlemeVerisi.zaman_artisi && this.duzenlemeVerisi.zaman_artisi !== this.isletme?.zaman_artisi) {
      guncellenecek.zaman_artisi = this.duzenlemeVerisi.zaman_artisi;
    }

    if (Object.keys(guncellenecek).length === 0) {
      alert('Değişiklik yapılmadı.');
      return;
    }

    this.authService.isletmeGuncelle(guncellenecek).subscribe({
      next: (response) => {
        this.isletme = this.authService.getCurrentIsletme();
        this.duzenlemeModu = false;
        alert('Bilgiler başarıyla güncellendi!');
      },
      error: (err) => {
        console.error('Güncelleme hatası:', err);
        alert('Güncelleme başarısız: ' + (err.error?.message || 'Bir hata oluştu'));
      }
    });
  }

  // ==================== FOTOĞRAF GÜNCELLEME ====================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Dosya türü kontrolü
      if (!file.type.startsWith('image/')) {
        alert('Lütfen bir resim dosyası seçin.');
        return;
      }
      // Dosya boyutu kontrolü (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      this.selectedFile = file;
    }
  }

  fotografGuncelle(): void {
    if (!this.selectedFile) {
      alert('Lütfen bir fotoğraf seçin.');
      return;
    }

    this.fotografYukleniyor = true;

    this.authService.fotografGuncelle(this.selectedFile).subscribe({
      next: (response) => {
        // localStorage'dan güncel veriyi al
        this.isletme = this.authService.getCurrentIsletme();

        this.selectedFile = null;
        this.fotografYukleniyor = false;

        // Sayfayı yenile - fotoğrafın görünmesi için
        if (response?.isletme?.fotograf) {
          alert('Fotoğraf başarıyla güncellendi!');
        } else {
          alert('İşlem tamamlandı ancak fotoğraf bilgisi dönmedi. Sayfayı yenileyin.');
        }
      },
      error: (err) => {
        console.error('Fotoğraf güncelleme hatası:', err);
        this.fotografYukleniyor = false;
        alert('Fotoğraf güncellenemedi: ' + (err.error?.message || 'Bir hata oluştu'));
      }
    });
  }

  fotografSec(): void {
    // Input elementini programatik olarak tıkla
    const fileInput = document.getElementById('fotografInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Randevu Detay Modal
  randevuDetayGoster(randevu: Randevu): void {
    this.seciliRandevu = randevu;
    this.detayModalAcik = true;
  }

  detayModalKapat(): void {
    this.detayModalAcik = false;
    this.seciliRandevu = null;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Çıkış hatası:', err);
        this.authService.forceLogout();
        this.router.navigate(['/login']);
      }
    });
  }
}
