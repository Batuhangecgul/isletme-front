# Benim Randevum - İşletme Randevu Sistemi Frontend

## 🌐 Canlı Demo

Uygulama şu adreste yayında:

 https://aninda-randevu.vercel.app/

Angular ile geliştirilmiş modern bir randevu sistemi frontend uygulaması. Kullanıcıların şehirlerindeki işletmeleri keşfetmelerine ve kolayca randevu almalarına olanak sağlar.

## 🚀 Özellikler

- **İşletme Keşfi**: Kuaför, berber, oto servis gibi kategorilerde işletme arama
- **Randevu Sistemi**: Kolay randevu alma ve yönetme
- **İşletme Paneli**: İşletme sahipleri için yönetim arayüzü
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **Modern UI**: Angular Material ve CSS ile şık arayüz

## 🛠️ Teknoloji Stack

- **Framework**: Angular 14
- **Dil**: TypeScript
- **Stil**: CSS
- **Build Tool**: Angular CLI
- **Test**: Jasmine + Karma

## 📋 Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn
- Angular CLI

## 🚀 Kurulum ve Çalıştırma

1. **Depoyu klonlayın:**
   ```bash
   git clone <repository-url>
   cd isletme-front
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm start
   ```

   Uygulama http://localhost:4200 adresinde çalışacaktır.

## 📜 Kullanılabilir Komutlar

- `npm start` - Geliştirme sunucusunu başlat
- `npm run build` - Üretim için build al
- `npm run watch` - Değişiklikleri izleyerek build et
- `npm test` - Testleri çalıştır

## 🏗️ Proje Yapısı

```
src/
├── app/
│   ├── anasayfa/          # Ana sayfa bileşeni
│   ├── login/            # Giriş bileşeni
│   ├── isletme-panel/    # İşletme yönetim paneli
│   ├── services/         # Servisler (auth, isletme)
│   └── core/             # Çekirdek modüller
├── assets/               # Statik dosyalar
└── environments/         # Ortam konfigürasyonları
```

## 🔧 Yapılandırma

- **Environment Dosyaları**: `src/environments/` altında production ve development ayarları
- **API Bağlantısı**: Servislerde backend API endpoint'lerini ayarlayın

## 🧪 Test

```bash
npm test
```

## 📱 Mobil Uygulama

Bu proje Capacitor ile mobil uygulamaya dönüştürülebilir:

- **Android**: `npx cap add android`
- **iOS**: `npx cap add ios`

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için issue açabilir veya geliştirici ekibiyle iletişime geçebilirsiniz.
