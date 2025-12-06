import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IsletmeService, Isletme, Calisan } from '../../services/isletme.service';

interface Slot {
  saat: string;
  durum: 'musait' | 'beklemede' | 'onaylandi' | 'iptal';
}

@Component({
  selector: 'app-randevu',
  templateUrl: './randevu.component.html',
  styleUrls: ['./randevu.component.css']
})
export class RandevuComponent implements OnInit {

  isletmeId: number | null = null;
  isletme: Isletme | null = null;
  calisanlar: Calisan[] = [];

  seciliCalisan: Calisan | null = null;
  seciliTarih: string = '';
  seciliSaat: string = '';

  slotlar: Slot[] = [];
  doluSlotlar: string[] = [];

  yukleniyor = true;
  slotlarYukleniyor = false;

  // Bugünün tarihi (minimum tarih için)
  bugun: string = '';
  // Maksimum tarih (7 gün sonrası)
  maksimumTarih: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private isletmeService: IsletmeService
  ) { }

  ngOnInit(): void {
    const now = new Date();
    this.bugun = now.toISOString().split('T')[0];
    this.seciliTarih = this.bugun;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    this.maksimumTarih = maxDate.toISOString().split('T')[0];

    this.route.params.subscribe(params => {
      this.isletmeId = +params['id'];
      this.verileriYukle();
    });
  }

  verileriYukle(): void {
    if (!this.isletmeId) return;

    this.isletmeService.getIsletme(this.isletmeId).subscribe({
      next: (data: any) => {
        this.isletme = data.isletme || data.data || data;
        console.log('İşletme:', this.isletme);
        console.log('zaman_artisi:', this.isletme?.zaman_artisi);
      },
      error: (err) => console.error('İşletme yüklenemedi:', err)
    });

    this.isletmeService.getCalisanlar(this.isletmeId).subscribe({
      next: (data: any) => {
        this.calisanlar = Array.isArray(data) ? data : (data.data || data.calisanlar || []);
        console.log('Çalışanlar:', this.calisanlar);
        this.yukleniyor = false;
      },
      error: (err) => {
        console.error('Çalışanlar yüklenemedi:', err);
        this.yukleniyor = false;
      }
    });
  }

  calisanSec(calisan: Calisan): void {
    console.log('Seçilen çalışan:', calisan);
    console.log('Çalışan ID:', calisan.id);
    this.seciliCalisan = calisan;
    this.seciliSaat = '';
    this.slotlariOlustur();
  }

  tarihDegisti(): void {
    this.seciliSaat = '';
    if (this.seciliCalisan) {
      this.slotlariOlustur();
    }
  }

  slotlariOlustur(): void {
    if (!this.seciliCalisan || !this.seciliTarih) return;

    this.slotlarYukleniyor = true;
    this.slotlar = [];

    // Çalışanın çalışma saatlerinden slotlar oluştur
    const baslangic = this.saatToMinute(this.seciliCalisan.baslangic_saati);
    const bitis = this.saatToMinute(this.seciliCalisan.bitis_saati);
    // İşletmenin zaman_artisi değerini kullan, yoksa varsayılan 30 dakika
    const slotSuresi = this.isletme?.zaman_artisi || 30;

    console.log('İşletme zaman_artisi:', this.isletme?.zaman_artisi);
    console.log('Kullanılan slot süresi:', slotSuresi);

    // Bugün için geçmiş saatleri filtrele
    const now = new Date();
    const bugunTarih = now.toISOString().split('T')[0];
    const simdikiDakika = now.getHours() * 60 + now.getMinutes();
    const bugunMu = this.seciliTarih === bugunTarih;

    const tumSlotlar: string[] = [];
    for (let dakika = baslangic; dakika < bitis; dakika += slotSuresi) {
      // Eğer bugünse ve saat geçmişse, bu slotu ekleme
      if (bugunMu && dakika <= simdikiDakika) {
        continue;
      }
      tumSlotlar.push(this.minuteToSaat(dakika));
    }

    // Randevuları API'den al
    // Çalışan ID'sini doğru şekilde al (id veya calisan_id olabilir)
    const calisanId = this.seciliCalisan.id || (this.seciliCalisan as any).calisan_id;
    console.log('API çağrısı yapılıyor - calisan_id:', calisanId, 'tarih:', this.seciliTarih);
    console.log('Seçili çalışan objesi:', this.seciliCalisan);

    this.isletmeService.getDoluSlotlar(calisanId, this.seciliTarih).subscribe({
      next: (data: any) => {
        console.log('API ham yanıt:', data);
        const randevular = Array.isArray(data) ? data : (data.data || data.randevular || []);
        console.log('Randevular:', randevular);

        // Randevu map'i oluştur (saat -> durum)
        const randevuMap: { [key: string]: string } = {};
        randevular.forEach((r: any) => {
          console.log('Randevu detay:', r);
          // baslangic_zamani varsa ondan saati al, yoksa saat alanını kullan
          let saat = '';
          if (r.baslangic_zamani) {
            // "2025-11-30 09:00:00" formatından saati al
            const timePart = r.baslangic_zamani.split(' ')[1];
            saat = timePart ? timePart.substring(0, 5) : '';
            console.log('baslangic_zamani\'dan saat:', saat);
          } else if (r.saat) {
            saat = r.saat.substring(0, 5);
            console.log('saat alanından:', saat);
          }
          // Randevu varsa ve yapilacak_islem null değilse durumuna göre işaretle
          if (saat && r.yapilacak_islem !== null && r.yapilacak_islem !== undefined) {
            randevuMap[saat] = r.durum || 'onaylandi';
            console.log('Dolu slot eklendi:', saat, 'durum:', r.durum, 'yapilacak_islem:', r.yapilacak_islem);
          }
        });
        console.log('Randevu map:', randevuMap);
        this.slotlar = tumSlotlar.map(saat => {
          const durum = randevuMap[saat];
          if (!durum) {
            return { saat, durum: 'musait' as const };
          }
          if (durum === 'beklemede') {
            return { saat, durum: 'beklemede' as const };
          }
          return { saat, durum: 'onaylandi' as const };
        });

        this.slotlarYukleniyor = false;
      },
      error: (err) => {
        console.error('Randevular yüklenemedi:', err);
        this.slotlar = tumSlotlar.map(saat => ({
          saat: saat,
          durum: 'musait' as const
        }));
        this.slotlarYukleniyor = false;
      }
    });
  }

  saatToMinute(saat: string): number {
    const parts = saat.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }

  minuteToSaat(dakika: number): string {
    const saat = Math.floor(dakika / 60);
    const min = dakika % 60;
    return `${saat.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }

  slotSec(slot: Slot): void {
    // Sadece müsait slotlar seçilebilir
    if (slot.durum !== 'musait') return;
    this.seciliSaat = slot.saat;
  }

  geriDon(): void {
    this.router.navigate(['/']);
  }
  musteriAdi: string = '';
  musteriTelefon: string = '';
  yapilacakIslem: string = '';
  randevuYukleniyor = false;
  randevuBasarili = false;
  randevuHata = '';

  randevuOlustur(): void {
    if (!this.seciliCalisan || !this.seciliTarih || !this.seciliSaat || !this.musteriTelefon || !this.musteriAdi || !this.isletmeId) {
      this.randevuHata = 'Lütfen tüm alanları doldurun';
      return;
    }

    this.randevuYukleniyor = true;
    this.randevuHata = '';

    // Çalışan ID'sini al (id veya calisan_id olabilir)
    const calisanId = this.seciliCalisan.id || (this.seciliCalisan as any).calisan_id;

    console.log('Seçili Çalışan:', this.seciliCalisan);
    console.log('Çalışan ID:', calisanId);

    // Başlangıç ve bitiş zamanlarını oluştur (datetime formatı: "2025-11-30 09:00:00")
    const baslangicZamani = `${this.seciliTarih} ${this.seciliSaat}:00`;

    // Bitiş zamanını hesapla (başlangıç + zaman_artisi)
    const zamanArtisi = this.isletme?.zaman_artisi || 30;
    const baslangicDakika = this.saatToMinute(this.seciliSaat);
    const bitisDakika = baslangicDakika + zamanArtisi;
    const bitisSaat = this.minuteToSaat(bitisDakika);
    const bitisZamani = `${this.seciliTarih} ${bitisSaat}:00`;

    const randevuData = {
      isletme_id: this.isletmeId!,
      calisan_id: calisanId,
      baslangic_zamani: baslangicZamani,
      bitis_zamani: bitisZamani,
      telefon: this.musteriTelefon,
      alan_kisi: this.musteriAdi,
      yapilacak_islem: this.yapilacakIslem || undefined
    };

    console.log('Randevu verileri:', randevuData);

    this.isletmeService.randevuAl(randevuData).subscribe({
      next: (response) => {
        console.log('Randevu oluşturuldu:', response);
        this.randevuYukleniyor = false;
        this.randevuBasarili = true;
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 3000);
      },
      error: (err) => {
        console.error('Randevu oluşturulamadı:', err);
        this.randevuYukleniyor = false;
        this.randevuHata = err.error?.message || 'Randevu oluşturulurken bir hata oluştu';
      }
    });
  }

}
