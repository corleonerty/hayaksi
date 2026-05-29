# 😤 Hay Aksi!

Beklenmedik aksiliklerde ne yapacağınızı söyleyen yapay zeka destekli rehber platformu.

## Kurulum

### 1. Gereksinimleri yükle
```bash
npm install
```

### 2. API Key ayarla
`.env.example` dosyasını kopyalayarak `.env` adıyla kaydet:
```bash
cp .env.example .env
```
Sonra `.env` dosyasını aç ve `your_api_key_here` yerine Anthropic API key'ini yaz.

API key almak için: https://console.anthropic.com

### 3. Geliştirme sunucusunu başlat
```bash
npm start
```

## Vercel'e Deploy

1. Bu repoyu GitHub'a yükle
2. [vercel.com](https://vercel.com) → New Project → GitHub reposunu seç
3. Environment Variables bölümüne ekle:
   - `REACT_APP_ANTHROPIC_API_KEY` = Anthropic API key'in
4. Deploy!

## Özellikler

- 🤖 Claude AI destekli anlık rehberlik
- 🗂️ 6 kategori (Araç, Ev, Sağlık, Teknoloji, Seyahat, Evcil Hayvan)
- 📱 Mobil uyumlu tasarım
- 💬 Çok turlu sohbet desteği
