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
  yukleniyor = true;
  storageUrl = 'http://127.0.0.1:8000/storage/';

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
    this.isletmeleriYukle();
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
        this.yukleniyor = false;
      },
      error: (err) => {
        console.error('İşletmeler yüklenemedi:', err);
        this.yukleniyor = false;
      }
    });
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
