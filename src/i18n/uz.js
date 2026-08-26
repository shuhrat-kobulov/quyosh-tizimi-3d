// Uzbek (Latin). The reference locale — new strings are added here first.
export default {
  code: 'uz',
  htmlLang: 'uz',
  label: "O'zbekcha",
  short: 'UZ',
  ogLocale: 'uz_UZ',

  ui: {
    docTitle: 'Quyosh Tizimi — 3D Sayohat',
    docDescription:
      "Interaktiv 3D Quyosh tizimi: sayyorani bosing — kamera uning yoniga uchib boradi, panelda esa u haqidagi ma'lumotlar chiqadi.",

    brandTitle: 'QUYOSH TIZIMI',
    brandTagline: 'interaktiv 3D sayohat',
    hint: "Sayyorani bosing · sichqoncha bilan aylantiring · g'ildirak = masshtab",

    langLabel: 'Til',

    loaderStars: 'Yulduzlar yoqilmoqda…',
    loaderSun: 'Quyosh yoqilmoqda…',
    loaderBody: '{name} yaratilmoqda…',
    loaderBelt: 'Asteroidlar kamari sochilmoqda…',
    loaderReady: 'Tayyor',
    loaderError: 'Xatolik: {message}',

    panelClose: 'Yopish',
    panelRegion: "Tanlangan jism haqida ma'lumot",
    panelFactTitle: 'Qiziqarli fakt',
    panelSource: "Manba: NASA ma'lumot sahifasi ↗",

    btnOverview: '⌂ Umumiy',
    btnOverviewTitle: "Umumiy ko'rinish (Esc)",
    btnOrbits: '◎ Orbitalar',
    btnOrbitsTitle: 'Orbitalar (O)',
    btnLabels: 'A Nomlar',
    btnLabelsTitle: 'Nomlar (L)',
    btnPause: '⏸ Pauza',
    btnResume: '▶ Davom',
    btnPauseTitle: "Vaqtni to'xtatish (Bo'sh joy)",
    speedLabel: 'Tezlik',

    offlineReady: 'Tayyor — bu sahifa endi internetsiz ham ochiladi.',

    errNoWebglTitle: "Brauzeringiz 3D ni qo'llab-quvvatlamadi",
    errNoWebglText:
      "Bu sahifa WebGL texnologiyasiga muhtoj. Chrome, Safari yoki Firefox ning yangi versiyasida oching, yoki brauzer sozlamalarida grafik tezlashtirishni (hardware acceleration) yoqing.",
    errInitTitle: "3D dvigatelni ishga tushirib bo'lmadi",
    errContextTitle: 'Grafik ulanish uzildi',
    errContextText: "Qurilma video xotirani bo'shatdi. Sahifani yangilang.",
  },

  kinds: {
    star: 'YULDUZ',
    planet: 'SAYYORA',
    gasGiant: 'GAZ GIGANTI',
    iceGiant: 'MUZ GIGANTI',
  },

  bodies: {
    sun: {
      name: 'Quyosh',
      kind: 'star',
      sub: 'G — sinf sariq mitti. Butun tizim massasining 99.86 foizi shu yerda.',
      facts: [
        ['Diametri', '1 392 700 km'],
        ['Sirt harorati', '≈ 5 500 °C'],
        ['Markaz harorati', '≈ 15 000 000 °C'],
        ['Yoshi', '≈ 4.6 mlrd yil'],
        ['Yerdan masofa', '149.6 mln km'],
      ],
      fact:
        "Har soniyada 600 million tonna vodorodni geliyga aylantiradi. Undan chiqqan yorug'lik Yergacha 8 daqiqa 20 soniyada yetib keladi.",
    },
    mercury: {
      name: 'Merkuriy',
      kind: 'planet',
      sub: "Quyoshga eng yaqin va tizimdagi eng kichik sayyora. Atmosferasi deyarli yo'q.",
      facts: [
        ['Diametri', '4 879 km'],
        ['Quyoshdan', '57.9 mln km'],
        ['Bir yili', '88 Yer kuni'],
        ['Bir sutkasi', '58.6 Yer kuni'],
        ["Yo'ldoshlari", '0'],
        ['Harorati', '−173 … +427 °C'],
      ],
      fact:
        "Atmosfera issiqlikni ushlab tura olmaydi: kunduzi sirt qo'rg'oshinni eritadigan darajada qiziydi, kechasi esa −170 °C gacha muzlaydi.",
    },
    venus: {
      name: 'Venera',
      kind: 'planet',
      sub: "Tizimdagi eng issiq sayyora. Qalin karbonat angidrid atmosferasi issiqlikni qamab qo'ygan.",
      facts: [
        ['Diametri', '12 104 km'],
        ['Quyoshdan', '108.2 mln km'],
        ['Bir yili', '225 Yer kuni'],
        ['Bir sutkasi', '243 Yer kuni'],
        ["Yo'ldoshlari", '0'],
        ['Harorati', '+464 °C'],
      ],
      fact:
        "O'z o'qi atrofida teskari yo'nalishda aylanadi — Venerada Quyosh g'arbdan chiqib, sharqda botadi. Bir sutkasi bir yilidan uzun.",
    },
    earth: {
      name: 'Yer',
      kind: 'planet',
      sub: 'Hozircha hayot borligi tasdiqlangan yagona osmon jismi. Sirtining 71 foizi suv.',
      facts: [
        ['Diametri', '12 742 km'],
        ['Quyoshdan', '149.6 mln km'],
        ['Bir yili', '365.25 kun'],
        ['Bir sutkasi', '23 soat 56 daq'],
        ["Yo'ldoshlari", '1 (Oy)'],
        ["O'rtacha harorat", '+15 °C'],
      ],
      fact:
        "O'q qiyaligi 23.4° — fasllar aynan shundan. Oy bu qiyalikni barqaror ushlab turadi, aks holda iqlim asrlar davomida keskin o'zgarib turardi.",
    },
    mars: {
      name: 'Mars',
      kind: 'planet',
      sub: "Qizil sayyora. Qutblarida muz, sirtida qurib qolgan daryo o'zanlari bor.",
      facts: [
        ['Diametri', '6 779 km'],
        ['Quyoshdan', '227.9 mln km'],
        ['Bir yili', '687 Yer kuni'],
        ['Bir sutkasi', '24 soat 37 daq'],
        ["Yo'ldoshlari", '2 (Fobos, Deymos)'],
        ["O'rtacha harorat", '−63 °C'],
      ],
      fact:
        "Quyosh tizimidagi eng baland tog' — Olimp vulqoni shu yerda: balandligi 21 km, ya'ni Everestdan qariyb 2.5 barobar baland.",
    },
    jupiter: {
      name: 'Yupiter',
      kind: 'gasGiant',
      sub: 'Tizimdagi eng katta sayyora — qolgan hamma sayyoralar birgalikda undan yengil.',
      facts: [
        ['Diametri', '139 820 km'],
        ['Quyoshdan', '778.5 mln km'],
        ['Bir yili', '11.9 Yer yili'],
        ['Bir sutkasi', '9 soat 56 daq'],
        ["Yo'ldoshlari", '95 dan ortiq'],
        ['Bulut harorati', '−145 °C'],
      ],
      fact:
        "Katta Qizil Dog' — kamida 350 yildan beri to'xtamayotgan bo'ron. Uning ichiga butun Yer bemalol sig'adi.",
    },
    saturn: {
      name: 'Saturn',
      kind: 'gasGiant',
      sub: "Halqalari 280 000 km ga cho'zilgan, lekin qalinligi ba'zi joyda atigi 10 metr.",
      facts: [
        ['Diametri', '116 460 km'],
        ['Quyoshdan', '1.43 mlrd km'],
        ['Bir yili', '29.5 Yer yili'],
        ['Bir sutkasi', '10 soat 42 daq'],
        ["Yo'ldoshlari", '146 dan ortiq'],
        ['Bulut harorati', '−178 °C'],
      ],
      fact:
        "Zichligi suvnikidan kam. Agar shunchalik katta okean topilsa, Saturn unda cho'kmasdan suzib yurardi.",
    },
    uranus: {
      name: 'Uran',
      kind: 'iceGiant',
      sub: "Yonboshlab aylanadigan muz giganti. O'q qiyaligi 98 daraja.",
      facts: [
        ['Diametri', '50 724 km'],
        ['Quyoshdan', '2.87 mlrd km'],
        ['Bir yili', '84 Yer yili'],
        ['Bir sutkasi', '17 soat 14 daq'],
        ["Yo'ldoshlari", '28'],
        ['Harorati', '−224 °C'],
      ],
      fact:
        "Deyarli yotgan holda aylanadi — qutblari navbat bilan 42 yil yorug'likda, keyin 42 yil zulmatda qoladi. Tizimdagi eng past harorat ham shu yerda qayd etilgan.",
    },
    neptune: {
      name: 'Neptun',
      kind: 'iceGiant',
      sub: "Eng uzoq sayyora. Ko'k rangi atmosferadagi metandan.",
      facts: [
        ['Diametri', '49 244 km'],
        ['Quyoshdan', '4.5 mlrd km'],
        ['Bir yili', '165 Yer yili'],
        ['Bir sutkasi', '16 soat 6 daq'],
        ["Yo'ldoshlari", '16'],
        ['Harorati', '−214 °C'],
      ],
      fact:
        "Shamol tezligi 2 100 km/soatgacha yetadi — tizimdagi eng kuchli bo'ronlar. Neptun teleskopda emas, avval qog'ozda — matematik hisob-kitob orqali topilgan.",
    },
  },
};
