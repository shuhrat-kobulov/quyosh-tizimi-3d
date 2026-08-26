# Quyosh Tizimi — 3D Sayohat

Three.js asosida qurilgan interaktiv Quyosh tizimi. Sayyorani bosasiz — kamera
uning yoniga uchib boradi, panelda esa u haqidagi ma'lumotlar chiqadi.

**Onlayn ko'rish:** https://shuhrat-kobulov.github.io/quyosh-tizimi-3d
*(Loyihani fork qilsangiz, `.env` faylidagi `VITE_SITE_URL` ni va yuqoridagi
manzilni o'zingiznikiga almashtiring — ijtimoiy tarmoqlarda havola qanday
ko'rinishi shunga bog'liq.)*

**Loyihada birorta ham tashqi rasm fayli yo'q.** Barcha sayyora teksturalari,
Saturn halqasi, yulduzlar va tumanliklar dastur ishga tushganda `canvas` va
fbm-shovqin yordamida kod bilan chiziladi. Quyosh esa to'liq GLSL shaderda
jonlanadi.

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
```

Boshqa buyruqlar:

```bash
npm run build      # dist/ papkasiga yig'ish
npm run preview    # yig'ilgan versiyani ko'rish
```

## Internetga chiqarish

Sayt to'liq statik — server kerak emas, `dist/` papkasini istalgan hostingga
tashlash kifoya (`vite.config.js` da `base: './'` turibdi, shuning uchun sayt
qaysi papkada turishidan qat'i nazar ishlaydi).

**GitHub Pages** uchun hamma narsa tayyor: repoga `main` ga push qilasiz,
`.github/workflows/deploy.yml` qolganini o'zi bajaradi. Bir martalik sozlash —
GitHub'da **Settings → Pages → Source = "GitHub Actions"**.

Keyin **`.env`** faylidagi manzilni o'zgartiring:

```bash
VITE_SITE_URL=https://foydalanuvchi.github.io/quyosh-tizimi-3d
```

Bu manzil Telegram va boshqa tarmoqlar havolani ko'rsatganda kerak bo'ladigan
`og:image` uchun ishlatiladi — u **to'liq** (absolyut) bo'lishi shart, aks holda
havola oddiy matn bo'lib chiqadi. Ulashishda ko'rinadigan rasm — `public/og.png`.

Netlify yoki Vercel uchun: build buyrug'i `npm run build`, papka `dist`.

## Boshqaruv

| Amal | Nima qiladi |
|---|---|
| Sayyorani bosish | O'sha sayyoraga uchib borish |
| Sichqonchani surish | Kamerani aylantirish |
| G'ildirak | Yaqinlashtirish / uzoqlashtirish |
| `1` … `8` | Merkuriydan Neptungacha |
| `Q` | Quyoshga o'tish |
| `0` yoki `Esc` | Umumiy ko'rinishga qaytish |
| `Bo'sh joy` | Vaqtni to'xtatish / davom ettirish |
| `O` | Orbita chiziqlarini yoqish/o'chirish |
| `L` | Nomlarni yoqish/o'chirish |

### Havola bilan ulashish

Manzil qatori tanlangan sayyoraga qarab o'zi yangilanadi, ya'ni brauzerdagi
havolani shundoq nusxalab yuborsangiz, ochgan odam aynan o'sha sayyorani
ko'radi:

```
?sayyora=saturn      # o'zbekcha kalitlar: quyosh, merkuriy, venera, yer, mars,
                     # yupiter, saturn, uran, neptun
?planet=earth        # inglizcha nomlar ham ishlaydi
```

O'qituvchi darsda "mana shu havolani oching" deb bitta sayyorani ko'rsata oladi.

Pastdagi "Tezlik" slayderi 0× dan 10× gacha. **1.0× tezlikda Yerning bir yili
taxminan 45 soniya** davom etadi — qolgan hamma sayyoralar shunga nisbatan
haqiqiy tezlik nisbatida harakatlanadi.

### Ma'lumot manbalari

Har bir sayyora panelining pastida **"Manba: NASA ma'lumot sahifasi"** havolasi
turadi — paneldagi raqamlar o'sha sahifalardagi qiymatlarga tayanadi. Dars
paytida savol tugʻilsa, o'qituvchi manbani darrov ocha oladi.

Manzillar `src/data/planets.js` dagi `NASA` obyektida yigʻilgan. Ular bir
qolipda emas (`/facts/` va `/venus-facts/` aralash), shuning uchun qo'lda
yozilgan. NASA sahifalarni ko'chirsa, tuzatadigan joy — shu bitta obyekt.

### Maxsus ehtiyojlar

- Qurilma sozlamasida **"harakatni kamaytirish"** yoqilgan bo'lsa (iOS: Settings
  → Accessibility → Motion, Windows/macOS da ham bor), kamera sayyoradan
  sayyoraga uchmaydi — darrov joyiga o'tadi. Katta ko'lamli kamera harakati
  vestibulyar sezgirligi bor odamda ko'ngil aynishiga sabab bo'ladi.
  Sayyoralarning aylanishi o'chirilmaydi — u bezak emas, mavzuning o'zi.
- Sahifani barmoq bilan kattalashtirish mumkin (`maximum-scale` cheklovi yo'q).
- Klaviatura bilan yurganda fokus konturi ko'rinadi; fokus tugmada turganda
  `Bo'sh joy` o'sha tugmani bosadi, pauzani emas.
- Panel `aria-live` bilan belgilangan — sayyora almashganda ekran o'quvchi
  yangi ma'lumotni o'qib beradi.

## Fayllar

```
src/
  main.js               sahna, kamera, post-processing, boshqaruv
  data/planets.js       sayyoralar ma'lumoti (o'lcham, orbita, faktlar)
  utils/noise.js        seed'li PRNG va gorizontal bo'yicha uzluksiz fbm shovqin
  utils/quality.js      qurilmaga qarab sahna og'irligini tanlash
  utils/textures.js     barcha teksturalar shu yerda chiziladi
  objects/sun.js        Quyosh: fotosfera shaderi, korona, nur
  objects/planets.js    sayyoralar, atmosfera, halqalar, yo'ldoshlar, orbitalar
  objects/space.js      yulduzlar, tumanliklar, asteroidlar kamari
  ui/hud.js             panel, tugmalar va 3D dan proyeksiya qilinadigan nomlar
```

## Ichkarida nima ishlayapti

**Protsedural teksturalar.** `utils/noise.js` dagi value-noise `x` o'qi bo'yicha
davriy qilib yozilgan — shuning uchun shar sirtida tekstura choki ko'rinmaydi.
Toshli sayyoralar uchun oddiy fbm ustiga "ridged" shovqin qo'shiladi (krater
gardishlari), gaz gigantlarida esa kenglik turbulentlik bilan buziladi va
natijada Yupiterning zonal chiziqlari hosil bo'ladi. Yer alohida ishlanadi:
okean chuqurligi, qit'alar, ~30° kenglikdagi cho'l mintaqalari, muz qalpoqlari,
alohida bulut qatlami va roughness xaritasi (okean silliq, quruqlik g'adir-budur).

**Quyosh.** Fotosfera — 3D simplex shovqinning ikki qatlami: sekin katta
konvektsiya hujayralari va tezroq granulyatsiya. Chekkalarida limb darkening
bor. Korona uchun oddiy Fresnel yaramaydi — u eng yorqin nuqtani tashqi chetga
qo'yib, aniq chegarali "pufak" hosil qiladi. Shuning uchun egri chiziq teskari
qilingan: yorqinlik fotosfera chetida maksimal bo'lib, tashqariga qarab nolga
tushadi.

**Asteroidlar kamari.** 2 200 ta tosh bitta `InstancedMesh` da. Har birining
o'z orbita radiusi va tezligi bor — ichkaridagilari Kepler qonuni ruhida
tezroq aylanadi, shuning uchun kamar vaqt o'tishi bilan "yoyilib" boradi.

**Sifat darajalari.** `utils/quality.js` yuklashdan oldin qurilmani baholaydi
(yadrolar soni, xotira, ekran o'lchami, sensorli ekranmi) va uchta darajadan
birini tanlaydi:

| Daraja | Piksel nisbati | Bloom | Tekstura | Yulduz | Asteroid |
|---|---|---|---|---|---|
| `past` | 1.0 | yo'q | ½ | 2 200 | 550 |
| `orta` | 1.5 | bor | ¾ | 4 000 | 1 200 |
| `yuqori` | 2.0 | bor | 1× | 6 500 | 2 200 |

Tekstura o'lchamini yarmiga tushirish yuklash vaqtini ham, video xotirani ham
taxminan 4 barobar kamaytiradi — fbm shovqin har bir piksel uchun hisoblanadi.
Past darajada bloom uchun `EffectComposer` umuman qurilmaydi.

Statik baho har doim ham to'g'ri chiqmaydi, shuning uchun birinchi 90 kadr
o'lchanadi: 34 fps dan past bo'lsa daraja bir pog'ona pasayadi (bir marta,
sahna "sakrab" turmasligi uchun). Majburan sinash: `?sifat=past`,
`?sifat=orta`, `?sifat=yuqori`.

**Kamera.** Sayyoraga o'tish real vaqtga bog'langan (kadrlar tezligiga emas),
shuning uchun sekin qurilmada ham o'tish belgilangan sekundlarda tugaydi.
O'tish tugagach kamera sayyora bilan birga siljiydi, lekin siz baribir uni
erkin aylantira va yaqinlashtira olasiz. Yaqinlashish burchagi Quyosh tomondan
tanlanadi — shuning uchun sayyoraning yoritilgan yuzi ko'rinadi.

## Sozlash

Brauzer konsolida `__solar` obyekti ochiq:

```js
__solar.bloom.strength = 0.3;      // porlashni kamaytirish
__solar.renderer.toneMappingExposure = 1.2;
__solar.bodies[2].data.speed = 3;  // Yerni tezlashtirish
```

`__solar.bloom` past darajada `null` bo'ladi (bloom o'chirilgan) — sinash uchun
sahifani `?sifat=yuqori` bilan oching.

Yangi sayyora yoki yo'ldosh qo'shish uchun `src/data/planets.js` ni tahrirlash
kifoya — qolgani avtomatik quriladi.

## Litsenziya

MIT — [LICENSE](LICENSE). Ya'ni maktabda, darsda, o'z loyihangizda bemalol
ishlatishingiz, o'zgartirishingiz va tarqatishingiz mumkin.
