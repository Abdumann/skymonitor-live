// Firebase veb sozlamasi (Project settings -> General -> Your apps -> Web app "sayt" -> Config).
// Bu qiymatlar OCHIQ bo'lishi mumkin: apiKey parol emas, faqat loyihani bildiradi. Ma'lumotni
// Realtime Database qoidalari himoya qiladi (database.rules.json): hamma faqat "sky" ni o'qiydi,
// yozishni faqat Sky Monitor (service account kaliti, kompyuterda) qila oladi.
// Service account JSON kalitini HECH QACHON shu yerga yoki repo'ga qo'ymang.
export const firebaseConfig = {
  apiKey: "AIzaSyDULqDvqMsvmk8-qjnZZn4HHzUBG_x0ptk",
  authDomain: "sky-monitor-live.firebaseapp.com",
  databaseURL: "https://sky-monitor-live-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sky-monitor-live",
  appId: "1:1068809084155:web:6f18b54084856c429ce45e",
};
