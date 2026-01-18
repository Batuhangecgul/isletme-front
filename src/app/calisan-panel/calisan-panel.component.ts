import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { IsletmeService, Randevu } from '../services/isletme.service';

@Component({
  selector: 'app-calisan-panel',
  templateUrl: './calisan-panel.component.html',
  styleUrls: ['./calisan-panel.component.css']
})
export class CalisanPanelComponent implements OnInit {

  calisanAdi = '';
  calisanEmail = '';
  randevular: Randevu[] = [];
  isDarkMode = false;
  
  // Filtreler
  seciliDurum = '';
  seciliTarih = '';
  
  // Modal
  seciliRandevu: Randevu | null = null;
  detayModalAcik = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private isletmeService: IsletmeService
  ) { }

  ngOnInit(): void {
    this.checkDarkMode();
    this.calisanBilgisiniYukle();
    this.randevulariYukle();
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

  calisanBilgisiniYukle(): void {
    const token = localStorage.getItem('token');
    const calisanData = localStorage.getItem('calisan');
    
    if (!token || !calisanData) {
      this.logout();
      return;
    }

    try {
      const calisan = JSON.parse(calisanData);
      this.calisanAdi = `${calisan.ad} ${calisan.soyad}`;
      this.calisanEmail = calisan.email;
    } catch (err) {
      console.error('Çalışan verisi parse edilemedi:', err);
      this.logout();
    }
  }

  randevulariYukle(): void {
    const calisanData = localStorage.getItem('calisan');
    if (!calisanData) return;

    try {
      const calisan = JSON.parse(calisanData);
      const isletmeId = calisan.isletme_id;
      const calisanId = calisan.calisan_id || calisan.id;

      // Çalışanın randevularını getir
      this.isletmeService.getRandevular(isletmeId, this.seciliDurum, this.seciliTarih).subscribe({
        next: (data: any) => {
          const allRandevular = Array.isArray(data) ? data : (data.data || data.randevular || []);
          // Sadece bu çalışana ait randevuları filtrele
          this.randevular = allRandevular.filter((r: Randevu) => {
            const rCalId = r.calisan_id || (r.calisan as any)?.calisan_id || (r.calisan as any)?.id;
            return rCalId === calisanId;
          });
          console.log('Çalışanın randevuları:', this.randevular);
        },
        error: (err) => console.error('Randevular yüklenemedi:', err)
      });
    } catch (err) {
      console.error('Çalışan verisi işlenemedi:', err);
    }
  }

  randevuGecmisMi(randevu: Randevu): boolean {
    if (!randevu.tarih && !randevu.baslangic_zamani) return false;
    const tarihi = randevu.tarih || randevu.baslangic_zamani;
    if (!tarihi) return false;
    const tarih = new Date(tarihi);
    return tarih < new Date();
  }

  formatRandevuTarih(randevu: Randevu): string {
    const tarih = randevu.tarih || randevu.baslangic_zamani;
    if (!tarih) return 'Belirtilmemiş';
    const date = new Date(tarih);
    const saat = randevu.saat || randevu.baslangic_zamani?.split(' ')[1] || '';
    return `${date.toLocaleDateString('tr-TR')} ${saat}`;
  }

  randevuDetayGoster(randevu: Randevu): void {
    this.seciliRandevu = randevu;
    this.detayModalAcik = true;
  }

  detayModalKapat(): void {
    this.detayModalAcik = false;
    this.seciliRandevu = null;
  }

  randevuOnayla(randevuId: number | undefined): void {
    if (!randevuId) return;
    this.isletmeService.randevuGuncelle(randevuId, 'onaylandi').subscribe({
      next: () => {
        console.log('Randevu onaylandı');
        this.randevulariYukle();
        this.detayModalKapat();
      },
      error: (err) => console.error('Randevu onaylanamadı:', err)
    });
  }

  randevuIptal(randevuId: number | undefined): void {
    if (!randevuId) return;
    this.isletmeService.randevuGuncelle(randevuId, 'iptal').subscribe({
      next: () => {
        console.log('Randevu iptal edildi');
        this.randevulariYukle();
        this.detayModalKapat();
      },
      error: (err) => console.error('Randevu iptali başarısız:', err)
    });
  }

  randevuBeklemedeYap(randevuId: number | undefined): void {
    if (!randevuId) return;
    this.isletmeService.randevuGuncelle(randevuId, 'beklemede').subscribe({
      next: () => {
        console.log('Randevu beklemeye alındı');
        this.randevulariYukle();
        this.detayModalKapat();
      },
      error: (err) => console.error('Randevu güncellenemedi:', err)
    });
  }

  randevuSil(randevuId: number | undefined): void {
    if (!randevuId) return;
    if (!confirm('Bu randevuyu silmek istediğinize emin misiniz?')) return;

    this.isletmeService.randevuSil(randevuId).subscribe({
      next: () => {
        console.log('Randevu silindi');
        this.randevulariYukle();
        this.detayModalKapat();
      },
      error: (err) => console.error('Randevu silinemedi:', err)
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
