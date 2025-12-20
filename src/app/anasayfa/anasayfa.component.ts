import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IsletmeService, Isletme, Calisan } from '../services/isletme.service';

@Component({
  selector: 'app-anasayfa',
  templateUrl: './anasayfa.component.html',
  styleUrls: ['./anasayfa.component.css']
})
export class AnasayfaComponent implements OnInit {

  isSloganCollapsed = false;
  isletmeler: Isletme[] = [];
  filtrelenmisIsletmeler: Isletme[] = [];
  yukleniyor = true;
  storageUrl = 'http://127.0.0.1:8000/storage/';
  aramaMetni = '';
  isDarkMode = false;
  aramaYapildi = false;
  sayfaHazir = false;

  // Pagination
  sayfaBasinaIsletme = 20;
  mevcutSayfa = 1;
  toplamSayfa = 1;

  // Modal
  modalAcik = false;
  seciliIsletme: Isletme | null = null;
  seciliIsletmeCalisanlar: Calisan[] = [];
  calisanlarYukleniyor = false;

  constructor(
    private isletmeService: IsletmeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkDarkMode();
    this.isletmeleriYukle();
    // Sayfa açılış animasyonu için kısa gecikme
    setTimeout(() => {
      this.sayfaHazir = true;
    }, 100);
    // Sayfa yüklendiğinde tüm işletmeler görünsün
    this.aramaYapildi = true;
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

  isletmeleriYukle(): void {
    this.isletmeService.getIsletmeler().subscribe({
      next: (data: any) => {
        // API response yapısına göre array'i çıkar
        if (Array.isArray(data)) {
          this.isletmeler = data;
        } else if (data.data) {
          this.isletmeler = data.data;
        } else if (data.isletmeler) {
          this.isletmeler = data.isletmeler;
        } else {
          // Object ise array'e çevir
          this.isletmeler = Object.values(data);
        }
        console.log('İşletmeler:', this.isletmeler);
        this.filtrelenmisIsletmeler = this.isletmeler;
        this.hesaplaSayfaSayisi();
        this.yukleniyor = false;
      },
      error: (err) => {
        console.error('İşletmeler yüklenemedi:', err);
        this.yukleniyor = false;
      }
    });
  }

  // Pagination metodları
  hesaplaSayfaSayisi(): void {
    this.toplamSayfa = Math.ceil(this.filtrelenmisIsletmeler.length / this.sayfaBasinaIsletme);
    if (this.toplamSayfa === 0) this.toplamSayfa = 1;
  }

  get gosterilecekIsletmeler(): Isletme[] {
    const baslangic = (this.mevcutSayfa - 1) * this.sayfaBasinaIsletme;
    const bitis = baslangic + this.sayfaBasinaIsletme;
    return this.filtrelenmisIsletmeler.slice(baslangic, bitis);
  }

  sonrakiSayfa(): void {
    if (this.mevcutSayfa < this.toplamSayfa) {
      this.mevcutSayfa++;
      this.scrollToResults();
    }
  }

  oncekiSayfa(): void {
    if (this.mevcutSayfa > 1) {
      this.mevcutSayfa--;
      this.scrollToResults();
    }
  }

  sayfayaGit(sayfa: number): void {
    if (sayfa >= 1 && sayfa <= this.toplamSayfa) {
      this.mevcutSayfa = sayfa;
      this.scrollToResults();
    }
  }

  scrollToResults(): void {
    setTimeout(() => {
      const resultsSection = document.querySelector('.popular-header');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  getFotoUrl(isletme: any): string {
    if (isletme.fotograf) {
      return this.storageUrl + isletme.fotograf;
    }
    return 'assets/default-isletme.jpg';
  }

  toggleSlogan(): void {
    this.isSloganCollapsed = !this.isSloganCollapsed;
  }

  ara(): void {
    const metin = this.aramaMetni.toLowerCase().trim();
    if (!metin) {
      this.filtrelenmisIsletmeler = this.isletmeler;
    } else {
      this.filtrelenmisIsletmeler = this.isletmeler.filter(isletme => {
        const isim = (isletme.isim || isletme.ad || '').toLowerCase();
        const kategori = (isletme.kategori || '').toLowerCase();
        const adres = (isletme.adres || '').toLowerCase();
        return isim.includes(metin) || kategori.includes(metin) || adres.includes(metin);
      });
    }
    this.mevcutSayfa = 1; // Aramada sayfayı sıfırla
    this.hesaplaSayfaSayisi();
    this.aramaYapildi = true;
    // Smooth scroll to results
    setTimeout(() => {
      const resultsSection = document.querySelector('.results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  tumunuGoster(): void {
    this.aramaMetni = '';
    this.filtrelenmisIsletmeler = this.isletmeler;
    this.aramaYapildi = true;
    // Smooth scroll to results
    setTimeout(() => {
      const resultsSection = document.querySelector('.results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  geriDon(): void {
    this.aramaYapildi = false;
    this.aramaMetni = '';
    this.filtrelenmisIsletmeler = this.isletmeler;
  }

  // Modal işlemleri
  detayGoster(isletme: Isletme): void {
    this.seciliIsletme = isletme;
    this.modalAcik = true;
    this.calisanlariYukle(isletme.id || isletme.isletme_id!);
  }

  modalKapat(): void {
    this.modalAcik = false;
    this.seciliIsletme = null;
    this.seciliIsletmeCalisanlar = [];
  }

  calisanlariYukle(isletmeId: number): void {
    this.calisanlarYukleniyor = true;
    this.isletmeService.getCalisanlar(isletmeId).subscribe({
      next: (data: any) => {
        this.seciliIsletmeCalisanlar = Array.isArray(data) ? data : (data.data || data.calisanlar || []);
        this.calisanlarYukleniyor = false;
      },
      error: (err) => {
        console.error('Çalışanlar yüklenemedi:', err);
        this.calisanlarYukleniyor = false;
      }
    });
  }

  randevuAl(isletme: Isletme): void {
    const isletmeId = isletme.id || isletme.isletme_id;
    this.modalKapat();
    this.router.navigate(['/randevu', isletmeId]);
  }

}
