# TrainLog Deploy

Bu proje Vercel uzerinde statik sayfalar + `/api` Node fonksiyonlari olarak deploy edilir. Veri katmani Neon Postgres kullanir.

## 1. Neon

1. Neon'da yeni project ac.
2. `Connection string` degerini kopyala.
3. Bu degeri `DATABASE_URL` olarak kullan.

## 2. Yerel Env

Projede [.env.local](C:\Users\Ertu\Desktop\Codex\.env.local) dosyasi var. Neon baglanti metnini bunun icine yaz:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

## 3. Vercel

1. Repo'yu GitHub'a push et.
2. Vercel'de `New Project` ile repo'yu import et.
3. Project Settings -> Environment Variables altinda `DATABASE_URL` ekle.
4. `Production`, `Preview`, `Development` ortamlarina tanimla.
5. Deploy et.

## 4. Ilk Acilis

1. Deploy URL'ni ac.
2. `/login` ekranindan kayit ol veya giris yap.
3. Ilk kayitta tablolar otomatik olusur.

## 5. Yerel Gelistirme

Iki secenek var:

- Eski SQLite server ile: `npm start`
- Vercel davranisini taklit etmek icin: `vercel dev`

`vercel dev` kullanacaksan once:

1. Vercel CLI kur
2. `vercel link`
3. `vercel env pull .env.local`
4. `vercel dev`
