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

  ara(): void {
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
