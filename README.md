# Sky Monitor — internetdagi jonli ko'rinish (ko'rgazma)

Sayt GitHub Pages'da, ma'lumot Firebase Realtime Database'da (bepul Spark rejasi). Sky Monitor
(kompyuter) bo'lim rasmlarini va asosiy raqamlarni Firebase'ga yozadi, sayt ularni real vaqtda
ko'rsatadi. Har kim o'z internetidan kiradi, kompyuterning IP manzili kerak emas.

```
Sky Monitor (PC) --service account--> Firebase RTDB  <--o'qish-- GitHub Pages sayti (telefonlar)
                                        sky/meta, sky/img/<i>, presence/<id>
```

## Fayllar
| Fayl | Vazifa |
|---|---|
| `index.html`, `style.css`, `app.js` | Sayt (freymvorksiz, build bosqichisiz) |
| `config.js` | Firebase veb sozlamasi (ochiq bo'lishi mumkin) |
| `database.rules.json` | Realtime Database qoidalari |

## Qaysi kalitlar ochiq bo'lishi mumkin
- `config.js` dagi `apiKey`, `projectId`, `databaseURL`, `appId` — ochiq. Bular parol emas, faqat
  loyihani bildiradi. Ma'lumotni qoidalar himoya qiladi.
- **Service account JSON** (`private_key` bor) — MAXFIY. U faqat kompyuterda turadi:
  `SkyMonitorApp/secrets/firebase_service_account.json` (`.gitignore` da). Hech qachon repo'ga,
  saytga yoki chatga qo'ymang.

## Qoidalar nima qiladi
- `sky` — hamma o'qiydi, brauzerdan hech kim yoza olmaydi. Faqat Sky Monitor yozadi (service
  account qoidalarni chetlab o'tadi).
- `presence/<id>` — har bir brauzer faqat o'z yozuvini (server vaqti) yozadi yoki o'chiradi.
  Ro'yxatni brauzerlar o'qiy olmaydi. Sky Monitor shu orqali ko'ruvchilarni sanaydi. Hech kim
  ko'rmasa rasm yubormaydi, bu bepul limitni tejaydi.
- Hammaga `".read": true, ".write": true` YO'Q: unday bo'lsa istalgan odam saytdagi rasmni
  almashtira oladi.

## O'rnatish (bir marta)
1. **Firebase loyihasi.** console.firebase.google.com -> *Add project* (masalan `sky-monitor-live`),
   Analytics shart emas.
2. **Realtime Database.** *Build -> Realtime Database -> Create database*, joylashuv `europe-west1`,
   *Start in locked mode*.
3. **Qoidalar.** *Rules* yorlig'i -> `database.rules.json` ichidagini to'liq qo'ying -> *Publish*.
4. **Veb ilova sozlamasi.** *Project settings -> General -> Your apps -> `</>` (Web)* -> nom bering
   (Hosting belgilamang) -> `firebaseConfig` qiymatlarini `config.js` ga qo'ying.
5. **Service account kaliti.** *Project settings -> Service accounts -> Generate new private key* ->
   faylni `D:\Detector\UI\SkyMonitorApp\secrets\firebase_service_account.json` nomi bilan saqlang.
6. **Sky Monitor sozlamasi** (`config.json`):
   `"cloud_publish": true`, `"firebase_db_url": "https://<loyiha>-default-rtdb.europe-west1.firebasedatabase.app"`.
   Keyin Sky Monitorni restart qiling. Konsolda `[cloud] Firebase'ga chiqarish yoqildi` chiqadi.
7. **GitHub.** github.com -> *New repository* (masalan `skymonitor-live`, Public, bo'sh) -> shu
   papkadagi 5 faylni yuklang (yoki git push).
8. **GitHub Pages.** Repo -> *Settings -> Pages -> Source: Deploy from a branch -> main / (root)* ->
   *Save*. 1-2 daqiqadan keyin manzil chiqadi: `https://<login>.github.io/skymonitor-live/`.
9. **QR.** Ko'rgazma ekranida `https://<login>.github.io/skymonitor-live/?qr=1` ni oching (yoki
   saytdagi "QR" tugmasi).

## Bepul limitlar (Spark) va sarf
- Bir vaqtda 100 tagacha ulanish (50+ ko'ruvchiga yetadi), oyiga 10 GB yuklab olish, 1 GB saqlash.
- Rasm oynaning asl o'lchamida (<= 1920 px) WebP, ~80-150 KB. Bo'lim ekranda o'zgarmagan bo'lsa qayta
  yuborilmaydi; o'zgargan bo'lim har 15 soniyadan tez yuborilmaydi. Asosiy bo'limni uzluksiz ko'rgan
  bitta odam soatiga ~30-40 MB oladi; odatiy tashrif (3-5 daqiqa) ~2-4 MB.
- Firebase konsolida *Usage* yorlig'ida sarfni kuzating.

## Ishlash tartibi
- Kompyuterda Sky Monitor oynasi ochiq turishi kerak (kichraytirilmagan; boshqa oyna ostida
  qolsa bo'ladi).
- Operator 60 soniya tegmasa, Sky Monitor bo'limlarni navbat bilan aylantiradi: hamma bo'limlar
  yangilanadi. Sichqoncha qimirlasa to'xtaydi.
- Sahifa yangilansa (refresh) ko'ruvchi yo'qolmaydi. Internet uzilsa o'zi qayta ulanadi.
