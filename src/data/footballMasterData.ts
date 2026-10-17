export interface FootballPlayer {
  id: string;
  name: string;             // Official Arabic name (e.g. "كريم بنزيما")
  aliases: string[];        // Common nicknames & English names (e.g. ["بنزيما", "الحكومة", "benzema"])
  nationality: string;      // Arabic country name (e.g. "فرنسا")
  nationalityCode: string;  // Country code for flag rendering (e.g. "FR", "SA")
  clubs: string[];          // Chronological career clubs in Arabic (e.g. ["ليون", "ريال مدريد", "الاتحاد"])
  currentClub: string;      // Current club (e.g. "الاتحاد")
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  traits?: string[];        // Visual/tactical traits for drafting (e.g. ["أسمر", "أخوان", "قائد", "لعب_بالسعودية"])
  trophies?: string[];      // Major titles (e.g. ["كأس العالم", "دوري أبطال أوروبا", "الكرة الذهبية"])
  photo?: string;           // Local headshot or avatar path
}

export interface FootballClubItem {
  id: string;
  name: string;             // e.g. "ريال مدريد", "الهلال"
  country: string;          // e.g. "إسبانيا", "السعودية"
  logoPlaceholder: string;  // Compact SVG / direct badge identifier
}

export const FOOTBALL_CLUBS_MASTER: FootballClubItem[] = [
  {
    "id": "c_hilal",
    "name": "الهلال",
    "country": "السعودية",
    "logoPlaceholder": "al-hilal"
  },
  {
    "id": "c_nassr",
    "name": "النصر",
    "country": "السعودية",
    "logoPlaceholder": "al-nassr"
  },
  {
    "id": "c_ittihad",
    "name": "الاتحاد",
    "country": "السعودية",
    "logoPlaceholder": "al-ittihad"
  },
  {
    "id": "c_ahli",
    "name": "الأهلي",
    "country": "السعودية",
    "logoPlaceholder": "al-ahli"
  },
  {
    "id": "c_shabab",
    "name": "الشباب",
    "country": "السعودية",
    "logoPlaceholder": "al-shabab"
  },
  {
    "id": "c_ettifaq",
    "name": "الاتفاق",
    "country": "السعودية",
    "logoPlaceholder": "al-ettifaq"
  },
  {
    "id": "c_qadsiah",
    "name": "القادسية",
    "country": "السعودية",
    "logoPlaceholder": "al-qadsiah"
  },
  {
    "id": "c_fateh",
    "name": "الفتح",
    "country": "السعودية",
    "logoPlaceholder": "al-fateh"
  },
  {
    "id": "c_taawoun",
    "name": "التعاون",
    "country": "السعودية",
    "logoPlaceholder": "al-taawoun"
  },
  {
    "id": "c_wehda",
    "name": "الوحدة",
    "country": "السعودية",
    "logoPlaceholder": "al-wehda"
  },
  {
    "id": "c_real_madrid",
    "name": "ريال مدريد",
    "country": "إسبانيا",
    "logoPlaceholder": "real-madrid"
  },
  {
    "id": "c_barcelona",
    "name": "برشلونة",
    "country": "إسبانيا",
    "logoPlaceholder": "barcelona"
  },
  {
    "id": "c_atletico_madrid",
    "name": "أتلتيكو مدريد",
    "country": "إسبانيا",
    "logoPlaceholder": "atletico"
  },
  {
    "id": "c_man_city",
    "name": "مانشستر سيتي",
    "country": "إنجلترا",
    "logoPlaceholder": "man-city"
  },
  {
    "id": "c_liverpool",
    "name": "ليفربول",
    "country": "إنجلترا",
    "logoPlaceholder": "liverpool"
  },
  {
    "id": "c_arsenal",
    "name": "أرسنال",
    "country": "إنجلترا",
    "logoPlaceholder": "arsenal"
  },
  {
    "id": "c_man_united",
    "name": "مانشستر يونايتد",
    "country": "إنجلترا",
    "logoPlaceholder": "man-utd"
  },
  {
    "id": "c_chelsea",
    "name": "تشيلسي",
    "country": "إنجلترا",
    "logoPlaceholder": "chelsea"
  },
  {
    "id": "c_tottenham",
    "name": "توتنهام",
    "country": "إنجلترا",
    "logoPlaceholder": "tottenham"
  },
  {
    "id": "c_bayern",
    "name": "بايرن ميونخ",
    "country": "ألمانيا",
    "logoPlaceholder": "bayern"
  },
  {
    "id": "c_dortmund",
    "name": "بوروسيا دورتموند",
    "country": "ألمانيا",
    "logoPlaceholder": "dortmund"
  },
  {
    "id": "c_leverkusen",
    "name": "باير ليفركوزن",
    "country": "ألمانيا",
    "logoPlaceholder": "leverkusen"
  },
  {
    "id": "c_inter",
    "name": "إنتر ميلان",
    "country": "إيطاليا",
    "logoPlaceholder": "inter"
  },
  {
    "id": "c_milan",
    "name": "ميلان",
    "country": "إيطاليا",
    "logoPlaceholder": "milan"
  },
  {
    "id": "c_juventus",
    "name": "يوفنتوس",
    "country": "إيطاليا",
    "logoPlaceholder": "juventus"
  },
  {
    "id": "c_napoli",
    "name": "نابولي",
    "country": "إيطاليا",
    "logoPlaceholder": "napoli"
  },
  {
    "id": "c_roma",
    "name": "روما",
    "country": "إيطاليا",
    "logoPlaceholder": "roma"
  },
  {
    "id": "c_psg",
    "name": "باريس سان جيرمان",
    "country": "فرنسا",
    "logoPlaceholder": "psg"
  },
  {
    "id": "c_porto",
    "name": "بورتو",
    "country": "البرتغال",
    "logoPlaceholder": "porto"
  },
  {
    "id": "c_benfica",
    "name": "بنفيكا",
    "country": "البرتغال",
    "logoPlaceholder": "benfica"
  },
  {
    "id": "c_ajax",
    "name": "أياكس",
    "country": "هولندا",
    "logoPlaceholder": "ajax"
  }
];

export const FOOTBALL_PLAYERS_MASTER: FootballPlayer[] = [
  {
    "id": "p_ilkay_gundogan",
    "name": "إلكاي غوندوغان",
    "aliases": [
      "غوندوغان",
      "جوندوجان",
      "جوندوجان",
      "إلكاي",
      "الكاي",
      "gundogan",
      "ilkay gundogan"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "نورنبرغ",
      "بوروسيا دورتموند",
      "مانشستر سيتي",
      "برشلونة",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "MID",
    "traits": [
      "قائد",
      "صانع ألعاب",
      "تمريرات"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_joao_cancelo",
    "name": "جواو كانسيلو",
    "aliases": [
      "كانسيلو",
      "cancelo",
      "joao cancelo",
      "جواو"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "بنفيكا",
      "فالنسيا",
      "إنتر ميلان",
      "يوفنتوس",
      "مانشستر سيتي",
      "بايرن ميونخ",
      "برشلونة",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "DEF",
    "traits": [
      "مهاري",
      "سريع",
      "عرضيات",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "الدوري الإيطالي",
      "الدوري الألماني"
    ],
    "photo": "/assets/football/players/cancelo.jpg"
  },
  {
    "id": "p_salem_dawsari",
    "name": "سالم الدوسري",
    "aliases": [
      "التورنيدو",
      "سالم",
      "الدوسري",
      "salem al-dawsari",
      "salem"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال",
      "فياريال",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "FWD",
    "traits": [
      "قائد",
      "لعب_بالسعودية",
      "مهاري",
      "سريع"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك",
      "أفضل لاعب في آسيا"
    ]
  },
  {
    "id": "p_majed_abdullah",
    "name": "ماجد عبد الله",
    "aliases": [
      "السهم الملتهب",
      "ماجد",
      "بيليه الصحراء",
      "majed abdullah"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "النصر"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "قائد",
      "لعب_بالسعودية",
      "هداف"
    ],
    "trophies": [
      "كأس آسيا",
      "الدوري السعودي",
      "كأس الكؤوس الآسيوية"
    ]
  },
  {
    "id": "p_sami_aljaber",
    "name": "سامي الجابر",
    "aliases": [
      "الذئب",
      "سامي",
      "الجابر",
      "sami al-jaber"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال",
      "وولفرهامبتون",
      "الهلال",
      "الغرافة",
      "الهلال"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "قائد",
      "لعب_بالسعودية",
      "محترف_سابق"
    ],
    "trophies": [
      "كأس آسيا",
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_youssef_thunayan",
    "name": "يوسف الثنيان",
    "aliases": [
      "الفيلسوف",
      "أبو يعقوب",
      "الثنيان",
      "yousuf al-thunayan"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "مهاري",
      "قائد",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "دوري أبطال آسيا",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_mohammed_noor",
    "name": "محمد نور",
    "aliases": [
      "القوة العاشرة",
      "أبو نوران",
      "نور",
      "mohammed noor"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتحاد",
      "النصر",
      "الاتحاد"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "قائد",
      "قوي_بدنياً",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس العرب"
    ]
  },
  {
    "id": "p_yasser_qahtani",
    "name": "ياسر القحطاني",
    "aliases": [
      "القناص",
      "ياسر",
      "الكاسر",
      "yasser al-qahtani"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "القادسية",
      "الهلال",
      "العين",
      "الهلال"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "قائد",
      "هداف",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس ولي العهد",
      "الدوري الإماراتي",
      "أفضل لاعب في آسيا"
    ]
  },
  {
    "id": "p_mohammed_deayea",
    "name": "محمد الدعيع",
    "aliases": [
      "الأخطبوط",
      "عميد لاعبي العالم",
      "الدعيع",
      "mohammed al-deayea"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الطائي",
      "الهلال"
    ],
    "currentClub": "معتزل",
    "position": "GK",
    "traits": [
      "أسطورة",
      "حارس_تاريخي",
      "قائد",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "دوري أبطال آسيا",
      "كأس الخليج",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_nawaf_temyat",
    "name": "نواف التمياط",
    "aliases": [
      "الفتى الذهبي",
      "التمياط",
      "نواف",
      "nawaf al-temyat"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "تسديد_قوي",
      "أفضل_لاعب_آسيوي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "أفضل لاعب في آسيا"
    ]
  },
  {
    "id": "p_saeed_owairan",
    "name": "سعيد العويران",
    "aliases": [
      "مارادونا العرب",
      "العويران",
      "saeed al-owairan"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الشباب"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "مهاري",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الخليج",
      "أفضل لاعب في آسيا"
    ]
  },
  {
    "id": "p_fahad_harifi",
    "name": "فهد الهريفي",
    "aliases": [
      "الموسيقار",
      "الهريفي",
      "fahad al-bishi"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "النخيل",
      "النصر"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "صانع_ألعاب",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "الدوري السعودي",
      "كأس الكؤوس الآسيوية"
    ]
  },
  {
    "id": "p_hussein_abdulghani",
    "name": "حسين عبد الغني",
    "aliases": [
      "الفتى الذهبي",
      "أبو عمر",
      "عبدالغني",
      "hussein abdulghani"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الأهلي",
      "نيوشاتل زاماكس",
      "النصر",
      "فيريا",
      "أحد",
      "الأهلي"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "قائد",
      "مقاتل",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "الدوري السعودي",
      "كأس ولي العهد"
    ]
  },
  {
    "id": "p_salman_faraj",
    "name": "سلمان الفرج",
    "aliases": [
      "المايسترو",
      "سلمان",
      "الفرج",
      "salman al-faraj"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال",
      "نيوم"
    ],
    "currentClub": "نيوم",
    "position": "MID",
    "traits": [
      "قائد",
      "مهاري",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_ali_bulayhi",
    "name": "علي البليهي",
    "aliases": [
      "البليهي",
      "المستفز",
      "ali al-bulayhi",
      "bulayhi"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الأمل",
      "النهضة",
      "الفتح",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "DEF",
    "traits": [
      "مقاتل",
      "شخصية_قوية",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_mohammed_kanno",
    "name": "محمد كنو",
    "aliases": [
      "كنو",
      "mohammed kanno",
      "kanno"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتفاق",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "MID",
    "traits": [
      "طويل_القامة",
      "تسديد_قوي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_saud_abdulhamid",
    "name": "سعود عبد الحميد",
    "aliases": [
      "سعود",
      "saud abdulhamid",
      "saud"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتحاد",
      "الهلال",
      "روما"
    ],
    "currentClub": "روما",
    "position": "DEF",
    "traits": [
      "سريع",
      "محترف_بأوروبا",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_mohammed_owais",
    "name": "محمد العويس",
    "aliases": [
      "العويس",
      "أخطبوط_المونديال",
      "mohammed al-owais"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الشباب",
      "الأهلي",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "GK",
    "traits": [
      "حارس",
      "بطل_مباراة_الأرجنتين",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_sultan_ghannam",
    "name": "سultan الغنام",
    "aliases": [
      "الغنام",
      "سلطان",
      "sultan al-ghannam"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الزلفي",
      "الفيصلي",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "DEF",
    "traits": [
      "عرضيات_متقنة",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_firas_buraikan",
    "name": "فراس البريكان",
    "aliases": [
      "البريكان",
      "فراس",
      "firas al-buraikan"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "النصر",
      "الفتح",
      "الأهلي"
    ],
    "currentClub": "الأهلي",
    "position": "FWD",
    "traits": [
      "هداف",
      "ذكي_تحرك",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_hassan_tambakti",
    "name": "حسان تمبكتي",
    "aliases": [
      "تمبكتي",
      "حسان",
      "hassan tambakti"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الشباب",
      "الوحدة",
      "الشباب",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "DEF",
    "traits": [
      "سريع",
      "مدافع_ذكي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_yasser_shahrani",
    "name": "ياسر الشهراني",
    "aliases": [
      "الشهراني",
      "ياسر",
      "yasser al-shahrani"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "القادسية",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "DEF",
    "traits": [
      "لياقة_عالية",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_abdulrahman_ghareeb",
    "name": "عبد الرحمن غريب",
    "aliases": [
      "غريب",
      "abdulrahman ghareeb"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الأهلي",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "FWD",
    "traits": [
      "مهاري",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس الملك سلمان للأندية"
    ]
  },
  {
    "id": "p_fahad_muwallad",
    "name": "فهد المولد",
    "aliases": [
      "المولد",
      "الفهد",
      "fahad al-muwallad"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتحاد",
      "ليفانتي",
      "الاتحاد",
      "الشباب"
    ],
    "currentClub": "الشباب",
    "position": "FWD",
    "traits": [
      "سريع_جداً",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس ولي العهد",
      "كأس الملك"
    ]
  },
  {
    "id": "p_abdullah_mayouf",
    "name": "عبد الله المعيوف",
    "aliases": [
      "المعيوف",
      "راعي_المعروف",
      "abdullah al-mayouf"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال",
      "الأهلي",
      "الهلال",
      "الاتحاد",
      "الشباب"
    ],
    "currentClub": "الشباب",
    "position": "GK",
    "traits": [
      "حارس",
      "تمريرات_دقيقة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_saleh_shehri",
    "name": "صالح الشهري",
    "aliases": [
      "الشهري",
      "صالح",
      "saleh al-shehri"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الأهلي",
      "بيرا مار",
      "الرائد",
      "الهلال",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "FWD",
    "traits": [
      "هداف_بديل",
      "سجل_على_الأرجنتين",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_abdulelah_amri",
    "name": "عبد الإله العمري",
    "aliases": [
      "العمري",
      "abdulelah al-amri"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "النصر",
      "الوحدة",
      "النصر",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "DEF",
    "traits": [
      "قوي_بدنياً",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_abdullah_malki",
    "name": "عبد الإله المالكي",
    "aliases": [
      "المالكي",
      "abdulelah al-malki"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الوحدة",
      "الاتحاد",
      "الهلال",
      "الاتفاق"
    ],
    "currentClub": "الاتفاق",
    "position": "MID",
    "traits": [
      "قاطع_كرات",
      "مقاتل",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_ali_hassan",
    "name": "علي الحسن",
    "aliases": [
      "الحسن",
      "ali al-hassan"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الفتح",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "MID",
    "traits": [
      "محور",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_nawaf_aqidi",
    "name": "نواف العقيدي",
    "aliases": [
      "العقيدي",
      "نواف",
      "nawaf al-aqidi"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "النصر",
      "الطائي",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "GK",
    "traits": [
      "حارس",
      "واعد",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس الملك سلمان للأندية"
    ]
  },
  {
    "id": "p_moteb_harbi",
    "name": "متعب الحربي",
    "aliases": [
      "الحربي",
      "متعب",
      "moteb al-harbi"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الشباب",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "DEF",
    "traits": [
      "ظهير_أيسر",
      "سريع",
      "صفقة_تاريخية",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس العرب للشباب"
    ]
  },
  {
    "id": "p_nasser_dawsari",
    "name": "ناصر الدوسري",
    "aliases": [
      "أسرع_هدف",
      "ناصر",
      "nasser al-dawsari"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "MID",
    "traits": [
      "جوكر",
      "تسديد_قوي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_hamzah_idris",
    "name": "حمزة إدريس",
    "aliases": [
      "حمزة_غول",
      "حمزة",
      "hamzah idris"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "أحد",
      "الاتحاد"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هداف_تاريخي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الكؤوس الآسيوية"
    ]
  },
  {
    "id": "p_saleh_nuaimah",
    "name": "صالح النعيمة",
    "aliases": [
      "القلب_الأسد",
      "النعيمة",
      "saleh nuaimah"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "قائد_تاريخي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_fuad_anwar",
    "name": "فؤاد أنور",
    "aliases": [
      "فؤاد",
      "صاحب_أول_هدف_مونديالي",
      "fuad anwar"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الشباب",
      "النصر",
      "شوانغ الصيني"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "قائد",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "الدوري السعودي",
      "كأس الخليج"
    ]
  },
  {
    "id": "p_ahmed_jamil",
    "name": "أحمد جميل",
    "aliases": [
      "السد_العالي",
      "جميل",
      "ahmed jamil"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتحاد"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "مدافع_تاريخي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "الدوري السعودي",
      "كأس الكؤوس الآسيوية"
    ]
  },
  {
    "id": "p_mohaisen_jaman",
    "name": "محيسن الجمعان",
    "aliases": [
      "الكوبرا",
      "محيسن",
      "mohaisen al-jaman"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "النصر"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "الدوري السعودي",
      "كأس الكؤوس الآسيوية"
    ]
  },
  {
    "id": "p_khalid_muwallad",
    "name": "خالد مسعد",
    "aliases": [
      "الأنيق",
      "خالد مسعد",
      "khalid massad"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الأهلي",
      "الاتحاد"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "قدم_يسرى_ساحرة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس آسيا",
      "كأس الخليج",
      "كأس ولي العهد"
    ]
  },
  {
    "id": "p_khalid_tiwairqi",
    "name": "خميس العويران",
    "aliases": [
      "خميس",
      "khamis al-owairan"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال",
      "الاتحاد"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "محور_صلب",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_cristiano_ronaldo",
    "name": "كريستيانو رونالدو",
    "aliases": [
      "الدون",
      "صاروخ ماديرا",
      "سي",
      "CR7",
      "ronaldo",
      "cristiano"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "سبورتينغ لشبونة",
      "مانشستر يونايتد",
      "ريال مدريد",
      "يوفنتوس",
      "مانشستر يونايتد",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "قائد",
      "هداف_تاريخي",
      "الكرة_الذهبية",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "كأس أمم أوروبا",
      "الدوري الإسباني",
      "الدوري الإنجليزي",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_karim_benzema",
    "name": "كريم بنزيما",
    "aliases": [
      "الحكومة",
      "بنزيما",
      "أبو إبراهيم",
      "benzema",
      "karim"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "ليون",
      "ريال مدريد",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "FWD",
    "traits": [
      "قائد",
      "الكرة_الذهبية",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "الدوري الإسباني",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_neymar_jr",
    "name": "نيمار دا سيلفا",
    "aliases": [
      "نيمار",
      "الساحر",
      "neymar",
      "neymar jr"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "سانتوس",
      "برشلونة",
      "باريس سان جيرمان",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "FWD",
    "traits": [
      "مهاري",
      "هداف_البرازيل_التاريخي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "كوبا ليبرتادوريس",
      "الدوري الإسباني",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_ngolo_kante",
    "name": "نغولو كانتي",
    "aliases": [
      "كانتي",
      "الرئة",
      "kante",
      "ngolo"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "بولون",
      "كاين",
      "ليستر سيتي",
      "تشيلسي",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "MID",
    "traits": [
      "قاطع_كرات",
      "بطل_العالم",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي"
    ]
  },
  {
    "id": "p_riyad_mahrez",
    "name": "رياض محرز",
    "aliases": [
      "محرز",
      "فخر العرب",
      "كنترول",
      "mahrez",
      "riyad"
    ],
    "nationality": "الجزائر",
    "nationalityCode": "DZ",
    "clubs": [
      "لوهافر",
      "ليستر سيتي",
      "مانشستر سيتي",
      "الأهلي"
    ],
    "currentClub": "الأهلي",
    "position": "FWD",
    "traits": [
      "قدم_يسرى_ساحرة",
      "كنترول_عالمي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس أمم أفريقيا"
    ]
  },
  {
    "id": "p_sadio_mane",
    "name": "ساديو ماني",
    "aliases": [
      "ماني",
      "أسد التيرانغا",
      "mane",
      "sadio"
    ],
    "nationality": "السنغال",
    "nationalityCode": "SN",
    "clubs": [
      "ميتز",
      "سالزبورغ",
      "ساوثهامبتون",
      "ليفربول",
      "بايرن ميونخ",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "FWD",
    "traits": [
      "سريع",
      "بطل_أفريقيا",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الألماني",
      "كأس أمم أفريقيا"
    ]
  },
  {
    "id": "p_roberto_firmino",
    "name": "روبرتو فيرمينو",
    "aliases": [
      "بوبي",
      "فيرمينو",
      "firmino",
      "bobby"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فيغورينسي",
      "هوفنهايم",
      "ليفربول",
      "الأهلي"
    ],
    "currentClub": "الأهلي",
    "position": "FWD",
    "traits": [
      "بدون_نظر",
      "مهاري",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_ruben_neves",
    "name": "روبن نيفيز",
    "aliases": [
      "نيفيز",
      "neves",
      "ruben"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "بورتو",
      "وولفرهامبتون",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "MID",
    "traits": [
      "تسديد_بعيد",
      "تمرير_طويل",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري الأمم الأوروبية",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_sergej_milinkovic_savic",
    "name": "سيرجي ميلينكوفيتش سافيتش",
    "aliases": [
      "سافيتش",
      "الرقيب",
      "sms",
      "savic"
    ],
    "nationality": "صربيا",
    "nationalityCode": "RS",
    "clubs": [
      "فويفودينا",
      "جينك",
      "لاتسيو",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "MID",
    "traits": [
      "طويل_القامة",
      "رأسيات_قاتلة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس إيطاليا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_aleksandar_mitrovic",
    "name": "ألكسندر ميتروفيتش",
    "aliases": [
      "ميتروفيتش",
      "ميترو",
      "mitrovic",
      "mitro"
    ],
    "nationality": "صربيا",
    "nationalityCode": "RS",
    "clubs": [
      "بارتيزان",
      "أندرلخت",
      "نيوكاسل",
      "فولهام",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "FWD",
    "traits": [
      "هداف_سفاح",
      "رأسيات",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "الدوري البلجيكي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_kalidou_koulibaly",
    "name": "خاليدو كوليبالي",
    "aliases": [
      "كوليبالي",
      "الجدار",
      "koulibaly"
    ],
    "nationality": "السنغال",
    "nationalityCode": "SN",
    "clubs": [
      "ميتز",
      "جينك",
      "نابولي",
      "تشيلسي",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "DEF",
    "traits": [
      "قوي_بدنياً",
      "قائد",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس أمم أفريقيا",
      "كأس إيطاليا",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_yassine_bono",
    "name": "ياسين بونو",
    "aliases": [
      "بونو",
      "ديما بونو",
      "bono",
      "bounou"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "الوداد",
      "أتلتيكو مدريد ب",
      "ريال سرقسطة",
      "جيرونا",
      "إشبيلية",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "GK",
    "traits": [
      "حارس_عالمي",
      "صد_بلنتيات",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الأوروبي",
      "الدوري السعودي",
      "أفضل حارس بأفريقيا"
    ]
  },
  {
    "id": "p_fabinho",
    "name": "فابينيو",
    "aliases": [
      "فابينيو",
      "الإعصار",
      "fabinho"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فلومينينسي",
      "ريال مدريد",
      "موناكو",
      "ليفربول",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "MID",
    "traits": [
      "قاطع_كرات",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_marcelo_brozovic",
    "name": "مارسيلو بروزوفيتش",
    "aliases": [
      "بروزوفيتش",
      "إيبك بروزو",
      "القنبلة",
      "brozovic"
    ],
    "nationality": "كرواتيا",
    "nationalityCode": "HR",
    "clubs": [
      "دينامو زغرب",
      "إنتر ميلان",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "MID",
    "traits": [
      "رئة_لا_تهدأ",
      "تمريرات_متقنة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "كأس إيطاليا",
      "كأس الملك سلمان للأندية"
    ]
  },
  {
    "id": "p_aymeric_laporte",
    "name": "إيمريك لابورت",
    "aliases": [
      "لابورت",
      "laporte"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "أتلتيك بيلباو",
      "مانشستر سيتي",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "DEF",
    "traits": [
      "قدم_يسرى",
      "بطل_أوروبا",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس أمم أوروبا"
    ]
  },
  {
    "id": "p_otavio",
    "name": "أوتافيو مونتيرو",
    "aliases": [
      "أوتافيو",
      "otavio"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "إنترناسيونال",
      "فيتوريا غيماريش",
      "بورتو",
      "النصر"
    ],
    "currentClub": "النصر",
    "position": "MID",
    "traits": [
      "مقاتل",
      "مهاري",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري البرتغالي",
      "كأس البرتغال"
    ]
  },
  {
    "id": "p_moussa_diaby",
    "name": "موسى ديابي",
    "aliases": [
      "ديابي",
      "diaby",
      "moussa"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "باريس سان جيرمان",
      "كروتوني",
      "باير ليفركوزن",
      "أستون فيلا",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "FWD",
    "traits": [
      "سريع_جداً",
      "صانع_أهداف",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_houssem_aouar",
    "name": "حسام عوار",
    "aliases": [
      "عوار",
      "aouar",
      "houssem"
    ],
    "nationality": "الجزائر",
    "nationalityCode": "DZ",
    "clubs": [
      "ليون",
      "روما",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "MID",
    "traits": [
      "مهاري",
      "هداف_وسط",
      "لعب_بالسعودية"
    ],
    "trophies": []
  },
  {
    "id": "p_steven_bergwijn",
    "name": "ستيفن بيرجوين",
    "aliases": [
      "بيرجوين",
      "bergwijn"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أيندهوفن",
      "توتنهام",
      "أياكس",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "FWD",
    "traits": [
      "سريع",
      "تسديد_قوي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_nacho_fernandez",
    "name": "ناتشو فيرنانديز",
    "aliases": [
      "ناتشو",
      "nacho",
      "nacho fernandez"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال مدريد",
      "القادسية"
    ],
    "currentClub": "القادسية",
    "position": "DEF",
    "traits": [
      "قائد_سابق_للريال",
      "بطل_أوروبا",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس أمم أوروبا"
    ]
  },
  {
    "id": "p_pierre_aubameyang",
    "name": "بيير إيميريك أوباميانغ",
    "aliases": [
      "أوباميانغ",
      "أوبا",
      "aubameyang",
      "auba"
    ],
    "nationality": "الغابون",
    "nationalityCode": "GA",
    "clubs": [
      "ميلان",
      "ديجون",
      "ليل",
      "موناكو",
      "سانت إيتيان",
      "بوروسيا دورتموند",
      "أرسنال",
      "برشلونة",
      "تشيلسي",
      "مارسيليا",
      "القادسية"
    ],
    "currentClub": "القادسية",
    "position": "FWD",
    "traits": [
      "هداف",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس إنجلترا",
      "الدوري الإسباني",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_franck_kessie",
    "name": "فرانك كيسييه",
    "aliases": [
      "كيسي",
      "الرئيس",
      "kessie",
      "franck"
    ],
    "nationality": "ساحل العاج",
    "nationalityCode": "CI",
    "clubs": [
      "أتالانتا",
      "تشيزينا",
      "ميلان",
      "برشلونة",
      "الأهلي"
    ],
    "currentClub": "الأهلي",
    "position": "MID",
    "traits": [
      "قوي_بدنياً",
      "بطل_أفريقيا",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس أمم أفريقيا",
      "الدوري الإيطالي",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_merih_demiral",
    "name": "ميريح ديميرال",
    "aliases": [
      "ديميرال",
      "المحارب",
      "demiral"
    ],
    "nationality": "تركيا",
    "nationalityCode": "TR",
    "clubs": [
      "سبورتينغ لشبونة",
      "ألانيا سبور",
      "ساسولو",
      "يوفنتوس",
      "أتالانتا",
      "الأهلي"
    ],
    "currentClub": "الأهلي",
    "position": "DEF",
    "traits": [
      "صلب_جداً",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_gabri_veiga",
    "name": "غابري فيغا",
    "aliases": [
      "فيغا",
      "veiga",
      "gabri"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "سلتا فيغو",
      "الأهلي"
    ],
    "currentClub": "الأهلي",
    "position": "MID",
    "traits": [
      "موهبة_شابة",
      "تسديد_دقيق",
      "لعب_بالسعودية"
    ],
    "trophies": []
  },
  {
    "id": "p_roger_ibanez",
    "name": "روجير إيبانيز",
    "aliases": [
      "إيبانيز",
      "ibanez"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فلومينينسي",
      "أتالانتا",
      "روما",
      "الأهلي"
    ],
    "currentClub": "الأهلي",
    "position": "DEF",
    "traits": [
      "ارتقاء_عالي",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري المؤتمر الأوروبي"
    ]
  },
  {
    "id": "p_yannick_carrasco",
    "name": "يانيك كاراسكو",
    "aliases": [
      "كاراسكو",
      "carrasco"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "موناكو",
      "أتلتيكو مدريد",
      "داليان الصيني",
      "أتلتيكو مدريد",
      "الشباب"
    ],
    "currentClub": "الشباب",
    "position": "FWD",
    "traits": [
      "مراوغ",
      "تسديد_قوي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الإسباني",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_daniel_podence",
    "name": "دانييل بودينس",
    "aliases": [
      "بودينس",
      "podence"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "سبورتينغ لشبونة",
      "أولمبياكوس",
      "وولفرهامبتون",
      "الشباب"
    ],
    "currentClub": "الشباب",
    "position": "FWD",
    "traits": [
      "قصير_القائمة",
      "مراوغ_سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري المؤتمر الأوروبي",
      "الدوري اليوناني"
    ]
  },
  {
    "id": "p_giacomo_bonaventura",
    "name": "جاكومو بونافينتورا",
    "aliases": [
      "بونافينتورا",
      "bonaventura",
      "jack"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "أتالانتا",
      "بادوفا",
      "ميلان",
      "فيورنتينا",
      "الشباب"
    ],
    "currentClub": "الشباب",
    "position": "MID",
    "traits": [
      "صانع_ألعاب",
      "خبرة_إيطالية",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس السوبر الإيطالي"
    ]
  },
  {
    "id": "p_chris_smalling",
    "name": "كريس سمالينغ",
    "aliases": [
      "سمالينغ",
      "smalling",
      "mike"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "فولهام",
      "مانشستر يونايتد",
      "روما",
      "الفيحاء"
    ],
    "currentClub": "الفيحاء",
    "position": "DEF",
    "traits": [
      "طويل_القامة",
      "مدافع_إنجليزي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "الدوري الأوروبي",
      "دوري المؤتمر الأوروبي"
    ]
  },
  {
    "id": "p_koen_casteels",
    "name": "كوين كاستيلس",
    "aliases": [
      "كاستيلس",
      "casteels"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "جينك",
      "هوفنهايم",
      "فيردر بريمن",
      "فولفسبورغ",
      "القادسية"
    ],
    "currentClub": "القادسية",
    "position": "GK",
    "traits": [
      "حارس",
      "طويل_جداً",
      "لعب_بالسعودية"
    ],
    "trophies": []
  },
  {
    "id": "p_predrag_rajkovic",
    "name": "بريدراج رايكوفيتش",
    "aliases": [
      "رايكوفيتش",
      "rajkovic"
    ],
    "nationality": "صربيا",
    "nationalityCode": "RS",
    "clubs": [
      "ريد ستار",
      "مكابي تل أبيب",
      "ستاد ريمس",
      "مايوركا",
      "الاتحاد"
    ],
    "currentClub": "الاتحاد",
    "position": "GK",
    "traits": [
      "حارس",
      "صد_كرات_صعبة",
      "لعب_بالسعودية"
    ],
    "trophies": []
  },
  {
    "id": "p_renan_lodi",
    "name": "رينان لودي",
    "aliases": [
      "لودي",
      "lodi",
      "renan"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "أتلتيكو باراناينسي",
      "أتلتيكو مدريد",
      "نوتينغهام فورست",
      "مارسيليا",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "DEF",
    "traits": [
      "ظهير_أيسر",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الإسباني",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_malcom",
    "name": "مالكوم فيليبي",
    "aliases": [
      "مالكوم",
      "malcom"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "كورينثيانز",
      "بوردو",
      "برشلونة",
      "زينيت",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "FWD",
    "traits": [
      "تسديد_يساري",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الإسباني",
      "الدوري الروسي",
      "الدوري السعودي",
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_marcos_leonardo",
    "name": "ماركوس ليوناردو",
    "aliases": [
      "ليوناردو",
      "marcos leonardo"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "سانتوس",
      "بنفيكا",
      "الهلال"
    ],
    "currentClub": "الهلال",
    "position": "FWD",
    "traits": [
      "مهاجم_شاب",
      "حاسم",
      "لعب_بالسعودية"
    ],
    "trophies": []
  },
  {
    "id": "p_abderrazak_hamdallah",
    "name": "عبد الرزاق حمد الله",
    "aliases": [
      "حمدالله",
      "الساطي",
      "جلاد_الحراس",
      "hamdallah"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "أولمبيك آسفي",
      "أوليسوند",
      "غوانغجو آر أند إف",
      "الجيش القطري",
      "الريان",
      "النصر",
      "الاتحاد",
      "الشباب"
    ],
    "currentClub": "الشباب",
    "position": "FWD",
    "traits": [
      "هداف_تاريخي",
      "سفاح_شباك",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_bafetimbi_gomis",
    "name": "بافيتيمبي غوميز",
    "aliases": [
      "الأسد",
      "غوميز",
      "gomis",
      "bafe"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "سانت إيتيان",
      "ليون",
      "سوانزي سيتي",
      "مارسيليا",
      "غلطة سراي",
      "الهلال",
      "غلطة سراي",
      "كاواساكي فرونتال"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "احتفالية_الأسد",
      "هداف_آسيا",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "الدوري التركي"
    ]
  },
  {
    "id": "p_sebastian_giovinco",
    "name": "سيباستيان جيوفينكو",
    "aliases": [
      "النملة_الذرية",
      "جيوفينكو",
      "giovinco"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "يوفنتوس",
      "إمبولي",
      "بارما",
      "تورونتو",
      "الهلال",
      "سامبدوريا"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "قصير_القائمة",
      "ضربات_حرة_ساحرة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري الإيطالي",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_carlos_eduardo",
    "name": "كارلوس إدواردو",
    "aliases": [
      "السوبر",
      "إدواردو",
      "eduardo",
      "carlos eduardo"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "إستوريل",
      "بورتو",
      "نيس",
      "الهلال",
      "شباب الأهلي",
      "الأهلي السعودي",
      "بوتافوغو"
    ],
    "currentClub": "بوتافوغو",
    "position": "MID",
    "traits": [
      "هداف_تاريخي_أجنبي",
      "رأسيات_بارعة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_omar_somah",
    "name": "عمر السومة",
    "aliases": [
      "العكيد",
      "السومة",
      "الهداف_التاريخي",
      "al-somah",
      "omar"
    ],
    "nationality": "سوريا",
    "nationalityCode": "SY",
    "clubs": [
      "الفتوة",
      "القادسية الكويتي",
      "الأهلي",
      "العربي القطري"
    ],
    "currentClub": "العربي القطري",
    "position": "FWD",
    "traits": [
      "هداف_دوري_روشن_التاريخي",
      "تسديد_خارق",
      "ركلات_حرة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الملك",
      "كأس ولي العهد"
    ]
  },
  {
    "id": "p_ever_banega",
    "name": "إيفر بانيغا",
    "aliases": [
      "بانيغا",
      "banega",
      "ever"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "بوكا جونيورز",
      "فالنسيا",
      "أتلتيكو مدريد",
      "نيولز أولد بويز",
      "إشبيلية",
      "إنتر ميلان",
      "إشبيلية",
      "الشباب",
      "نيولز أولد بويز"
    ],
    "currentClub": "نيولز أولد بويز",
    "position": "MID",
    "traits": [
      "مايسترو",
      "تمريرات_ساحرة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري الأوروبي",
      "كوبا ليبرتادوريس",
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_lionel_messi",
    "name": "ليونيل ميسي",
    "aliases": [
      "البرغوث",
      "ليو",
      "ميسي",
      "البولغا",
      "messi",
      "lionel"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "برشلونة",
      "باريس سان جيرمان",
      "إنتر ميامي"
    ],
    "currentClub": "إنتر ميامي",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "قائد",
      "الكرة_الذهبية",
      "بطل_العالم",
      "أعظم_لاعب"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا",
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "الدوري الإسباني",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_kylian_mbappe",
    "name": "كيليان مبابي",
    "aliases": [
      "مبابي",
      "الفتى الذهبي",
      "mbappe",
      "kylian"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "موناكو",
      "باريس سان جيرمان",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "FWD",
    "traits": [
      "سريع_خارق",
      "هداف",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "دوري الأمم الأوروبية",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_erling_haaland",
    "name": "إيرلينغ هالاند",
    "aliases": [
      "الوحش",
      "الفايكنغ",
      "هالاند",
      "haaland",
      "erling"
    ],
    "nationality": "النرويج",
    "nationalityCode": "NO",
    "clubs": [
      "برينه",
      "مولده",
      "سالزبورغ",
      "بوروسيا دورتموند",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "FWD",
    "traits": [
      "سفاح_أهداف",
      "قوي_جداً",
      "سريع"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الحذاء الذهبي الأوروبي"
    ]
  },
  {
    "id": "p_vinicius_junior",
    "name": "فينيسيوس جونيور",
    "aliases": [
      "فيني",
      "فيني جونيور",
      "vinicius",
      "vini"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فلامنغو",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "FWD",
    "traits": [
      "مراوغ_عالمي",
      "سريع",
      "حاسم"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_jude_bellingham",
    "name": "جود بيلينغهام",
    "aliases": [
      "بيلينغهام",
      "جود",
      "bellingham",
      "jude"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "برمنغهام سيتي",
      "بوروسيا دورتموند",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "MID",
    "traits": [
      "شامل",
      "هداف_وسط",
      "شخصية_قيادية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_rodri_hernandez",
    "name": "رودري هيرنانديز",
    "aliases": [
      "رودري",
      "المايسترو",
      "البالون دور",
      "rodri"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "فياريال",
      "أتلتيكو مدريد",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "MID",
    "traits": [
      "الكرة_الذهبية",
      "ضابط_إيقاع",
      "بطل_أوروبا"
    ],
    "trophies": [
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "كأس أمم أوروبا",
      "الدوري الإنجليزي"
    ]
  },
  {
    "id": "p_kevin_de_bruyne",
    "name": "كيفين دي بروين",
    "aliases": [
      "المهندس",
      "دي بروين",
      "KDB",
      "de bruyne",
      "kevin"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "جينك",
      "تشيلسي",
      "فيردر بريمن",
      "فولفسبورغ",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "MID",
    "traits": [
      "ملك_الأسيست",
      "تسديد_قوي",
      "رؤية_خارقة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_mohamed_salah",
    "name": "محمد صلاح",
    "aliases": [
      "الملك المصري",
      "أبو مكة",
      "صلاح",
      "مو صلاح",
      "salah",
      "mo salah"
    ],
    "nationality": "مصر",
    "nationalityCode": "EG",
    "clubs": [
      "المقاولون العرب",
      "بازل",
      "تشيلسي",
      "فيورنتينا",
      "روما",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "FWD",
    "traits": [
      "فخر_العرب",
      "هداف",
      "سريع",
      "حاسم"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس العالم للأندية",
      "الحذاء الذهبي الإنجليزي"
    ]
  },
  {
    "id": "p_harry_kane",
    "name": "هاري كين",
    "aliases": [
      "الهداف",
      "كين",
      "المعذب",
      "kane",
      "harry"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "توتنهام",
      "ليستر سيتي",
      "ميلوول",
      "نورويتش سيتي",
      "توتنهام",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "FWD",
    "traits": [
      "هداف_إنجلترا_التاريخي",
      "تسديد_دقيق",
      "صانع_ألعاب"
    ],
    "trophies": [
      "الحذاء الذهبي الأوروبي",
      "هداف كأس العالم"
    ]
  },
  {
    "id": "p_robert_lewandowski",
    "name": "روبرت ليفاندوفسكي",
    "aliases": [
      "ليفاندوفسكي",
      "ليفا",
      "السفاح",
      "lewandowski",
      "lewy"
    ],
    "nationality": "بولندا",
    "nationalityCode": "PL",
    "clubs": [
      "زنيتش بروشكوف",
      "ليخ بوزنان",
      "بوروسيا دورتموند",
      "بايرن ميونخ",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "FWD",
    "traits": [
      "قناص_أهداف",
      "أفضل_لاعب_بالعالم_سابقاً"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني",
      "الدوري الإسباني",
      "الحذاء الذهبي الأوروبي"
    ]
  },
  {
    "id": "p_luka_modric",
    "name": "لوكا مودريتش",
    "aliases": [
      "الساحر",
      "لوكا",
      "مودريتش",
      "كرويف البلقان",
      "modric",
      "luka"
    ],
    "nationality": "كرواتيا",
    "nationalityCode": "HR",
    "clubs": [
      "دينامو زغرب",
      "زرينجسكي",
      "إنتر زابرشيتش",
      "توتنهام",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "MID",
    "traits": [
      "الكرة_الذهبية",
      "تمريرات_تاريخية",
      "قائد",
      "أسطورة"
    ],
    "trophies": [
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "أفضل لاعب بالمونديال"
    ]
  },
  {
    "id": "p_toni_kroos",
    "name": "توني كروس",
    "aliases": [
      "المهندس الألماني",
      "كروس",
      "القناص",
      "kroos",
      "toni"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "بايرن ميونخ",
      "باير ليفركوزن",
      "بايرن ميونخ",
      "ريال مدريد"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "دقة_تمرير_100%",
      "بطل_العالم",
      "أسطورة"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_virgil_van_dijk",
    "name": "فيرجيل فان دايك",
    "aliases": [
      "فان دايك",
      "الصخرة",
      "van dijk",
      "virgil"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "غرونينغن",
      "سيلتيك",
      "ساوثهامبتون",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "DEF",
    "traits": [
      "مدافع_لا_يمر",
      "قائد",
      "طويل_القامة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "أفضل لاعب بأوروبا"
    ]
  },
  {
    "id": "p_bukayo_saka",
    "name": "بوكايو ساكا",
    "aliases": [
      "ساكا",
      "الفتى الذهبي",
      "الستار بوي",
      "saka",
      "bukayo"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "FWD",
    "traits": [
      "مهاري",
      "حاسم",
      "قدم_يسرى"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_phil_foden",
    "name": "فيل فودين",
    "aliases": [
      "فودين",
      "ابن ستوكبورت",
      "foden",
      "phil"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "MID",
    "traits": [
      "مهاري_جداً",
      "أفضل_لاعب_بالبريميرليغ",
      "تسديد_قوي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_martin_odegaard",
    "name": "مارتن أوديغارد",
    "aliases": [
      "أوديغارد",
      "الكابتن",
      "odegaard",
      "martin"
    ],
    "nationality": "النرويج",
    "nationalityCode": "NO",
    "clubs": [
      "سترومسغودست",
      "ريال مدريد",
      "هيرنفين",
      "فيتيسه",
      "ريال سوسيداد",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "MID",
    "traits": [
      "قائد",
      "تمريرات_حريرية",
      "رؤية_ملعب"
    ],
    "trophies": [
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_bernardo_silva",
    "name": "برناردو سيلفا",
    "aliases": [
      "برناردو",
      "سيلفا",
      "العقل المدبر",
      "bernardo silva"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "بنفيكا",
      "موناكو",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "MID",
    "traits": [
      "مراوغ_في_مساحات_ضيقة",
      "ضغط_عالي",
      "ذكي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الفرنسي",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_antoine_griezmann",
    "name": "أنطوان غريزمان",
    "aliases": [
      "غريزمان",
      "الرجل الصغير",
      "griezmann",
      "antoine"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "ريال سوسيداد",
      "أتلتيكو مدريد",
      "برشلونة",
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "FWD",
    "traits": [
      "بطل_العالم",
      "ذكي",
      "صانع_وهداف"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الأوروبي",
      "دوري الأمم الأوروبية",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_bruno_fernandes",
    "name": "برونو فيرنانديز",
    "aliases": [
      "برونو",
      "الكابيتانو",
      "bruno fernandes"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "نوفارا",
      "أودينيزي",
      "سامبدوريا",
      "سبورتينغ لشبونة",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "MID",
    "traits": [
      "قائد",
      "صانع_فرص",
      "تسديد_بعيد"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي",
      "كأس الرابطة",
      "كأس البرتغال"
    ]
  },
  {
    "id": "p_thibaut_courtois",
    "name": "تيبو كورتوا",
    "aliases": [
      "كورتوا",
      "الجدار البلجيكي",
      "courtois",
      "thibaut"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "جينك",
      "أتلتيكو مدريد",
      "تشيلسي",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "GK",
    "traits": [
      "عملاق",
      "حاسم_بالنهائيات",
      "طويل_القامة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الإنجليزي"
    ]
  },
  {
    "id": "p_alisson_becker",
    "name": "أليسون بيكر",
    "aliases": [
      "أليسون",
      "الجدار البرازيلي",
      "alisson",
      "becker"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "إنترناسيونال",
      "روما",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "GK",
    "traits": [
      "حارس_عالمي",
      "انفرادات",
      "تمرير"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_ederson_moraes",
    "name": "إيدرسون مورايس",
    "aliases": [
      "إيدرسون",
      "ederson"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "ريبيراو",
      "ريو أفي",
      "بنفيكا",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "GK",
    "traits": [
      "تمريرات_طويلة_خارقة",
      "شجاع"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_marc_andre_ter_stegen",
    "name": "مارك أندريه تير شتيغن",
    "aliases": [
      "تير شتيغن",
      "شتيغن",
      "ter stegen"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "بوروسيا مونشنغلادباخ",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "GK",
    "traits": [
      "ردة_فعل_سريعة",
      "لعب_بالقدمين"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_jan_oblak",
    "name": "يان أوبلاك",
    "aliases": [
      "أوبلاك",
      "جدار مدريد",
      "oblak",
      "jan"
    ],
    "nationality": "سلوفينيا",
    "nationalityCode": "SI",
    "clubs": [
      "أولمبيا ليوبليانا",
      "بنفيكا",
      "أولينينسي",
      "ليريا",
      "ريو أفي",
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "GK",
    "traits": [
      "ردات_فعل_مذهلة",
      "ثابت"
    ],
    "trophies": [
      "الدوري الإسباني",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_william_saliba",
    "name": "ويليام ساليبا",
    "aliases": [
      "ساليبا",
      "الصخرة الفرنسية",
      "saliba",
      "william"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "سانت إيتيان",
      "نيس",
      "مارسيليا",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "DEF",
    "traits": [
      "مدافع_عصري",
      "هادئ_بالكرة",
      "سريع"
    ],
    "trophies": []
  },
  {
    "id": "p_ruben_dias",
    "name": "روبن دياز",
    "aliases": [
      "دياز",
      "القائد الدفاعي",
      "ruben dias",
      "dias"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "بنفيكا",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "DEF",
    "traits": [
      "قائد_دفاع",
      "صلب",
      "بطل_أوروبا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_declan_rice",
    "name": "ديكلان رايس",
    "aliases": [
      "رايس",
      "المدمرة",
      "rice",
      "declan"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "وست هام",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "MID",
    "traits": [
      "قاطع_كرات",
      "انطلاقات_بدنية",
      "تسديد"
    ],
    "trophies": [
      "دوري المؤتمر الأوروبي"
    ]
  },
  {
    "id": "p_lamine_yamal",
    "name": "لامين يامال",
    "aliases": [
      "يامال",
      "الجوهرة",
      "لامين",
      "yamal",
      "lamine"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "FWD",
    "traits": [
      "أصغر_بطل_لليورو",
      "مراوغ_ساحر",
      "قدم_يسرى",
      "موهبة_تاريخية"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_pedri_gonzalez",
    "name": "بيدري غونزاليس",
    "aliases": [
      "بيدري",
      "إنييستا الصغير",
      "pedri"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "لاس بالماس",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "MID",
    "traits": [
      "رؤية_ساحرة",
      "بطل_أوروبا",
      "مراوغ_ذكي"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الإسباني",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_gavi_paez",
    "name": "بابلو غافي",
    "aliases": [
      "غافي",
      "المحارب",
      "gavi"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "MID",
    "traits": [
      "مقاتل",
      "شغف_عالي",
      "ضغط_شرس"
    ],
    "trophies": [
      "الدوري الإسباني",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_federico_valverde",
    "name": "فيديريكو فالفيردي",
    "aliases": [
      "الصقر",
      "فالفيردي",
      "فيدي",
      "valverde",
      "fede"
    ],
    "nationality": "الأوروغواي",
    "nationalityCode": "UY",
    "clubs": [
      "بينارول",
      "ديبورتيفو لاكورونيا",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "MID",
    "traits": [
      "صواريخ_بعيدة",
      "مجهود_خرافي",
      "سريع_وقوي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_eduardo_camavinga",
    "name": "إدواردو كامافينغا",
    "aliases": [
      "كامافينغا",
      "الجوكر",
      "camavinga"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "رين",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "MID",
    "traits": [
      "جوكر_أي_مركز",
      "مرونة_بدنية",
      "مهاري"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_aurelien_tchouameni",
    "name": "أوريلين تشواميني",
    "aliases": [
      "تشواميني",
      "tchouameni"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "بوردو",
      "موناكو",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "MID",
    "traits": [
      "قوي_بدنياً",
      "قاطع_كرات",
      "تسديد_بعيد"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_rodrygo_goes",
    "name": "رودريغو غوس",
    "aliases": [
      "رودريغو",
      "رجل_الريمونتادا",
      "rodrygo"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "سانتوس",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "FWD",
    "traits": [
      "حاسم_بالأبطال",
      "مراوغ",
      "بارد_الأعصاب"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_jamal_musiala",
    "name": "جمال موسيالا",
    "aliases": [
      "بامبي",
      "موسيالا",
      "musiala",
      "jamal"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "تشيلسي_شباب",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "MID",
    "traits": [
      "مراوغة_في_مساحة_ضائعة",
      "سريع",
      "حاسم"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_florian_wirtz",
    "name": "فلوريان فيرتز",
    "aliases": [
      "فيرتز",
      "الساحر الألماني",
      "wirtz",
      "florian"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "كولن",
      "باير ليفركوزن"
    ],
    "currentClub": "باير ليفركوزن",
    "position": "MID",
    "traits": [
      "بطل_الدوري_بلا_هزيمة",
      "رؤية_ساحرة",
      "هداف_وصانع"
    ],
    "trophies": [
      "الدوري الألماني",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_joshua_kimmich",
    "name": "جوشوا كيميش",
    "aliases": [
      "كيميش",
      "القائد",
      "kimmich",
      "joshua"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "لايبزيغ",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "MID",
    "traits": [
      "قائد",
      "تكتيكي_خارق",
      "عرضيات_دقيقة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني",
      "كأس القارات"
    ]
  },
  {
    "id": "p_son_heung_min",
    "name": "سون هيونغ مين",
    "aliases": [
      "سوني",
      "سون",
      "النفاثة الكورية",
      "son",
      "sonny"
    ],
    "nationality": "كوريا الجنوبية",
    "nationalityCode": "KR",
    "clubs": [
      "هامبورغ",
      "باير ليفركوزن",
      "توتنهام"
    ],
    "currentClub": "توتنهام",
    "position": "FWD",
    "traits": [
      "إنهاء_بالقدمين",
      "سريع_جداً",
      "أفضل_لاعب_بآسيا"
    ],
    "trophies": [
      "الحذاء الذهبي الإنجليزي",
      "ذهبية دورة الألعاب الآسيوية"
    ]
  },
  {
    "id": "p_lautaro_martinez",
    "name": "لاوتارو مارتينيز",
    "aliases": [
      "التورو",
      "الثور",
      "لاوتارو",
      "lautaro",
      "el toro"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "راسينغ كلوب",
      "إنتر ميلان"
    ],
    "currentClub": "إنتر ميلان",
    "position": "FWD",
    "traits": [
      "بطل_العالم",
      "هداف_الدوري_الإيطالي",
      "قناص"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا",
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_nicolo_barella",
    "name": "نيكولو باريلا",
    "aliases": [
      "باريلا",
      "محرك_الوسط",
      "barella"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "كالياري",
      "كومو",
      "إنتر ميلان"
    ],
    "currentClub": "إنتر ميلان",
    "position": "MID",
    "traits": [
      "بطل_أوروبا",
      "مجهود_بدني_خرافي",
      "قتالي"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_victor_osimhen",
    "name": "فيكتور أوسيمين",
    "aliases": [
      "أوسيمين",
      "القناع",
      "osimhen",
      "victor"
    ],
    "nationality": "نيجيريا",
    "nationalityCode": "NG",
    "clubs": [
      "فولفسبورغ",
      "شارلروا",
      "ليل",
      "نابولي",
      "غلطة سراي"
    ],
    "currentClub": "غلطة سراي",
    "position": "FWD",
    "traits": [
      "ارتقاء_خارق",
      "سريع_وقوي",
      "هداف"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "أفضل لاعب بأفريقيا"
    ]
  },
  {
    "id": "p_rafael_leao",
    "name": "رافايل لياو",
    "aliases": [
      "لياو",
      "الابتسامة",
      "leao",
      "rafael"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "سبورتينغ لشبونة",
      "ليل",
      "ميلان"
    ],
    "currentClub": "ميلان",
    "position": "FWD",
    "traits": [
      "انطلاقات_مرعبة",
      "مهاري_جداً",
      "سريع"
    ],
    "trophies": [
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_khvicha_kvaratskhelia",
    "name": "خفيتشا كفاراتسخيليا",
    "aliases": [
      "كفارا",
      "كفارادونا",
      "kvara",
      "kvaratskhelia"
    ],
    "nationality": "جورجيا",
    "nationalityCode": "GE",
    "clubs": [
      "دينامو تبليسي",
      "روبين كازان",
      "دينامو باتومي",
      "نابولي"
    ],
    "currentClub": "نابولي",
    "position": "FWD",
    "traits": [
      "مراوغات_غير_متوقعة",
      "بطل_إيطاليا"
    ],
    "trophies": [
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_cole_palmer",
    "name": "كول بالمر",
    "aliases": [
      "كولد بالمر",
      "بالمر",
      "cold palmer",
      "palmer"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "مانشستر سيتي",
      "تشيلسي"
    ],
    "currentClub": "تشيلسي",
    "position": "MID",
    "traits": [
      "بارد_الأعصاب",
      "أهداف_وصناعة",
      "بلنتيات_مضمونة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي"
    ]
  },
  {
    "id": "p_julian_alvarez",
    "name": "خوليان ألفاريز",
    "aliases": [
      "العنكبوت",
      "ألفاريز",
      "la arana",
      "alvarez",
      "julian"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "ريفر بليت",
      "مانشستر سيتي",
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "FWD",
    "traits": [
      "حقق_كل_الألقاب_الممكنة",
      "بطل_العالم",
      "ضغط_عالي"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "كوبا أمريكا",
      "الدوري الإنجليزي",
      "كوبا ليبرتادوريس"
    ]
  },
  {
    "id": "p_dani_carvajal",
    "name": "داني كارفخال",
    "aliases": [
      "كارفخال",
      "المقاتل",
      "carvajal",
      "dani"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال مدريد كاستيا",
      "باير ليفركوزن",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "DEF",
    "traits": [
      "6_ألقاب_أبطال",
      "بطل_أوروبا",
      "مقاتل"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "كأس أمم أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_antonio_rudiger",
    "name": "أنطونيو روديغر",
    "aliases": [
      "روديغر",
      "المجنون",
      "الصلب",
      "rudiger",
      "antonio"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "شتوتغارت",
      "روما",
      "تشيلسي",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "DEF",
    "traits": [
      "مدافع_شرس",
      "سريع",
      "حركات_جنونية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_trent_alexander_arnold",
    "name": "ترينت ألكسندر أرنولد",
    "aliases": [
      "ترينت",
      "أرنولد",
      "TAA",
      "trent"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "DEF",
    "traits": [
      "عرضيات_تاريخية",
      "صانع_ألعاب_من_الظهير",
      "ضربات_حرة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي"
    ]
  },
  {
    "id": "p_theo_hernandez",
    "name": "ثيو هيرنانديز",
    "aliases": [
      "ثيو",
      "القطار السريع",
      "theo",
      "theo hernandez"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "أتلتيكو مدريد",
      "ألافيس",
      "ريال مدريد",
      "ريال سوسيداد",
      "ميلان"
    ],
    "currentClub": "ميلان",
    "position": "DEF",
    "traits": [
      "سريع_كالبرق",
      "أهداف_فردية_صاروخية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_alphonso_davies",
    "name": "ألفونسو ديفيز",
    "aliases": [
      "ديفيز",
      "فونزي",
      "roadrunner",
      "davies"
    ],
    "nationality": "كندا",
    "nationalityCode": "CA",
    "clubs": [
      "فانكوفر وايتكابس",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "DEF",
    "traits": [
      "أسرع_لاعب_بالعالم",
      "انطلاقات_خارقة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_achraf_hakimi",
    "name": "أشرف حكيمي",
    "aliases": [
      "حكيمي",
      "القطار المغربي",
      "hakimi",
      "achraf"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "ريال مدريد",
      "بوروسيا دورتموند",
      "إنتر ميلان",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "DEF",
    "traits": [
      "سريع_جداً",
      "رابع_العالم",
      "هجومي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "الدوري الفرنسي",
      "برونزية_الأولمبياد"
    ]
  },
  {
    "id": "p_leroy_sane",
    "name": "ليروي ساني",
    "aliases": [
      "ساني",
      "sane",
      "leroy"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "شالكه",
      "مانشستر سيتي",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "FWD",
    "traits": [
      "سريع_ومراوغ",
      "تسديد_دقيق"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_ousmane_dembele",
    "name": "عثمان ديمبيلي",
    "aliases": [
      "ديمبيلي",
      "البعوضة",
      "dembele",
      "ousmane"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "رين",
      "بوروسيا دورتموند",
      "برشلونة",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "FWD",
    "traits": [
      "يلعب_بالقدمين_بالتساوي",
      "مراوغ_عالمي",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الإسباني",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_nico_williams",
    "name": "نيكو ويليامز",
    "aliases": [
      "نيكو",
      "nico williams"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "أتلتيك بيلباو"
    ],
    "currentClub": "أتلتيك بيلباو",
    "position": "FWD",
    "traits": [
      "بطل_أوروبا",
      "سريع_كالريح",
      "مراوغ"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_dusan_vlahovic",
    "name": "دوشان فلاهوفيتش",
    "aliases": [
      "فلاهوفيتش",
      "vlahovic",
      "dusan"
    ],
    "nationality": "صربيا",
    "nationalityCode": "RS",
    "clubs": [
      "بارتيزان",
      "فيورنتينا",
      "يوفنتوس"
    ],
    "currentClub": "يوفنتوس",
    "position": "FWD",
    "traits": [
      "هداف_يساري",
      "تسديد_قوي",
      "طويل"
    ],
    "trophies": [
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_enzo_fernandez",
    "name": "إنزو فيرنانديز",
    "aliases": [
      "إنزو",
      "enzo fernandez"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "ريفر بليت",
      "ديفنسا خوستيكا",
      "بنفيكا",
      "تشيلسي"
    ],
    "currentClub": "تشيلسي",
    "position": "MID",
    "traits": [
      "أفضل_شاب_بالمونديال",
      "بطل_العالم",
      "تمرير_رائع"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا",
      "كوبا سودأمريكانا"
    ]
  },
  {
    "id": "p_alexis_mac_allister",
    "name": "أليكسيس ماك أليستر",
    "aliases": [
      "ماك أليستر",
      "mac allister"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "أرجنتينوس جونيورز",
      "بوكا جونيورز",
      "برايتون",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "MID",
    "traits": [
      "بطل_العالم",
      "ذكي_تكتيكياً",
      "تسديد"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا",
      "كأس الرابطة الإنجليزية"
    ]
  },
  {
    "id": "p_emiliano_martinez",
    "name": "إميليانو مارتينيز",
    "aliases": [
      "ديبو",
      "مارتينيز",
      "ديبو مارتينيز",
      "dibu martinez",
      "emiliano"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "أرسنال",
      "أكسفورد",
      "شيفيلد وينزداي",
      "روذرهام",
      "وولفرهامبتون",
      "خيتافي",
      "ريدينغ",
      "أستون فيلا"
    ],
    "currentClub": "أستون فيلا",
    "position": "GK",
    "traits": [
      "بطل_العالم",
      "أفضل_حارس_بالعالم",
      "متخصص_بلنتيات"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا",
      "كأس ياشين"
    ]
  },
  {
    "id": "p_gianluigi_donnarumma",
    "name": "جانلويجي دوناروما",
    "aliases": [
      "دوناروما",
      "جيجو",
      "donnarumma",
      "gigio"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "ميلان",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "GK",
    "traits": [
      "طويل_جداً",
      "أفضل_لاعب_باليورو_سابقاً",
      "صد_بلنتيات"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_manuel_neuer",
    "name": "مانويل نوير",
    "aliases": [
      "نوير",
      "الحارس القشاش",
      "neuer",
      "manuel"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "شالكه",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "GK",
    "traits": [
      "أسطورة",
      "مخترع_الحارس_القشاش",
      "بطل_العالم",
      "قائد"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_thomas_muller",
    "name": "توماس مولر",
    "aliases": [
      "مولر",
      "مترجم المساحات",
      "muller",
      "thomas"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "FWD",
    "traits": [
      "ذكي_بشكل_خارق",
      "بطل_العالم",
      "هداف_المونديال"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_granit_xhaka",
    "name": "غرانيت تشاكا",
    "aliases": [
      "تشاكا",
      "xhaka",
      "granit"
    ],
    "nationality": "سويسرا",
    "nationalityCode": "CH",
    "clubs": [
      "بازل",
      "بوروسيا مونشنغلادباخ",
      "أرسنال",
      "باير ليفركوزن"
    ],
    "currentClub": "باير ليفركوزن",
    "position": "MID",
    "traits": [
      "قائد",
      "تسديد_يساري",
      "بطل_الدوري_بلا_هزيمة"
    ],
    "trophies": [
      "الدوري الألماني",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_jeremie_frimpong",
    "name": "جيريمي فريمبونغ",
    "aliases": [
      "فريمبونغ",
      "frimpong"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "سيلتيك",
      "باير ليفركوزن"
    ],
    "currentClub": "باير ليفركوزن",
    "position": "DEF",
    "traits": [
      "سريع_جداً",
      "أهداف_وصناعة_من_الظهير"
    ],
    "trophies": [
      "الدوري الألماني",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_alejandro_grimaldo",
    "name": "أليخاندرو غريمالدو",
    "aliases": [
      "غريمالدو",
      "grimaldo"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة ب",
      "بنفيكا",
      "باير ليفركوزن"
    ],
    "currentClub": "باير ليفركوزن",
    "position": "DEF",
    "traits": [
      "ضربات_حرة_قاتلة",
      "بطل_أوروبا"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الألماني",
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_hakan_calhanoglu",
    "name": "هاكان تشالهان أوغلو",
    "aliases": [
      "تشالهان أوغلو",
      "هاكان",
      "calhanoglu"
    ],
    "nationality": "تركيا",
    "nationalityCode": "TR",
    "clubs": [
      "كارلسروه",
      "هامبورغ",
      "باير ليفركوزن",
      "ميلان",
      "إنتر ميلان"
    ],
    "currentClub": "إنتر ميلان",
    "position": "MID",
    "traits": [
      "ملك_الركلات_الثابتة",
      "مايسترو_إيطاليا"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_federico_dimarco",
    "name": "فيديريكو ديماركو",
    "aliases": [
      "ديماركو",
      "dimarco"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "إنتر ميلان",
      "أسكولي",
      "إمبولي",
      "سيون",
      "بارما",
      "هيلاس فيرونا",
      "إنتر ميلان"
    ],
    "currentClub": "إنتر ميلان",
    "position": "DEF",
    "traits": [
      "عرضيات_مبهرة",
      "أهداف_من_نصف_الملعب"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_marcus_thuram",
    "name": "ماركوس تورام",
    "aliases": [
      "تورام",
      "thuram",
      "marcus"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "سوشو",
      "غانغون",
      "بوروسيا مونشنغلادباخ",
      "إنتر ميلان"
    ],
    "currentClub": "إنتر ميلان",
    "position": "FWD",
    "traits": [
      "قوي_وسريع",
      "ابن_ليليان_تورام"
    ],
    "trophies": [
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_alessandro_bastoni",
    "name": "أليساندرو باستوني",
    "aliases": [
      "باستوني",
      "bastoni"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "أتالانتا",
      "أتالانتا",
      "إنتر ميلان",
      "بارما",
      "إنتر ميلان"
    ],
    "currentClub": "إنتر ميلان",
    "position": "DEF",
    "traits": [
      "مدافع_صانع_ألعاب",
      "بطل_أوروبا"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_ollie_watkins",
    "name": "أولي واتكينز",
    "aliases": [
      "واتكينز",
      "watkins",
      "ollie"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "إكسيتر سيتي",
      "برينتفورد",
      "أستون فيلا"
    ],
    "currentClub": "أستون فيلا",
    "position": "FWD",
    "traits": [
      "هداف_شامل",
      "صانع_فرص"
    ],
    "trophies": []
  },
  {
    "id": "p_alexander_isak",
    "name": "ألكسندر إيزاك",
    "aliases": [
      "إيزاك",
      "إيزاك السويدي",
      "isak",
      "alexander"
    ],
    "nationality": "السويد",
    "nationalityCode": "SE",
    "clubs": [
      "أيك سولنا",
      "بوروسيا دورتموند",
      "فيليم 2",
      "ريال سوسيداد",
      "نيوكاسل"
    ],
    "currentClub": "نيوكاسل",
    "position": "FWD",
    "traits": [
      "مهاري_وطويل",
      "إنهاء_بارد"
    ],
    "trophies": [
      "كأس ملك إسبانيا",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_bruno_guimaraes",
    "name": "برونو غيماريش",
    "aliases": [
      "غيماريش",
      "bruno guimaraes"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "أتلتيكو باراناينسي",
      "ليون",
      "نيوكاسل"
    ],
    "currentClub": "نيوكاسل",
    "position": "MID",
    "traits": [
      "مقاتل_وسط",
      "تمريرات_كسر_خطوط",
      "ذهبية_الأولمبياد"
    ],
    "trophies": [
      "ذهبية_الأولمبياد",
      "كوبا سودأمريكانا"
    ]
  },
  {
    "id": "p_anthony_gordon",
    "name": "أنتوني غوردون",
    "aliases": [
      "غوردون",
      "gordon",
      "anthony"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "إيفرتون",
      "بريستون",
      "إيفرتون",
      "نيوكاسل"
    ],
    "currentClub": "نيوكاسل",
    "position": "FWD",
    "traits": [
      "سريع_جداً",
      "ضغط_عالي"
    ],
    "trophies": [
      "كأس أوروبا تحت 21"
    ]
  },
  {
    "id": "p_marcos_llorente",
    "name": "ماركوس يورينتي",
    "aliases": [
      "يورينتي",
      "llorente",
      "marcos"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال مدريد",
      "ألافيس",
      "ريال مدريد",
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "MID",
    "traits": [
      "سرعة_رهيبة",
      "جوكر"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_koke_resurreccion",
    "name": "كوكي ريسوريكسيون",
    "aliases": [
      "كوكي",
      "كابيتانو الأتليتي",
      "koke"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "MID",
    "traits": [
      "قائد_تاريخي",
      "أكثر_من_لعب_للأتليتي"
    ],
    "trophies": [
      "الدوري الإسباني",
      "الدوري الأوروبي",
      "كأس السوبر الأوروبي"
    ]
  },
  {
    "id": "p_inaki_williams",
    "name": "إينياكي ويليامز",
    "aliases": [
      "إينياكي",
      "الفهد الباسكي",
      "inaki williams"
    ],
    "nationality": "غانا",
    "nationalityCode": "GH",
    "clubs": [
      "أتلتيك بيلباو"
    ],
    "currentClub": "أتلتيك بيلباو",
    "position": "FWD",
    "traits": [
      "سريع_خارق",
      "رقم_قياسي_مباريات_متتالية"
    ],
    "trophies": [
      "كأس ملك إسبانيا",
      "كأس السوبر الإسباني"
    ]
  },
  {
    "id": "p_takefusa_kubo",
    "name": "تاكيفوسا كوبو",
    "aliases": [
      "كوبو",
      "ميسي اليابان",
      "kubo",
      "take"
    ],
    "nationality": "اليابان",
    "nationalityCode": "JP",
    "clubs": [
      "إف سي طوكيو",
      "يوكوهاما مارينوس",
      "ريال مدريد",
      "مايوركا",
      "فياريال",
      "خيتافي",
      "ريال سوسيداد"
    ],
    "currentClub": "ريال سوسيداد",
    "position": "FWD",
    "traits": [
      "مراوغ_ساحر",
      "قدم_يسرى",
      "سريع"
    ],
    "trophies": []
  },
  {
    "id": "p_isco_alarcon",
    "name": "إيسكو ألاركون",
    "aliases": [
      "الماجيا",
      "إيسكو",
      "isco",
      "magia"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "فالنسيا",
      "مالقا",
      "ريال مدريد",
      "إشبيلية",
      "ريال بيتيس"
    ],
    "currentClub": "ريال بيتيس",
    "position": "MID",
    "traits": [
      "سحر_المراوغة",
      "خمسة_أبطال_أوروبا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_nabil_fekir",
    "name": "نبيل فقير",
    "aliases": [
      "فقير",
      "fekir",
      "nabil"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "ليون",
      "ريال بيتيس",
      "الجزيرة الإماراتي"
    ],
    "currentClub": "الجزيرة الإماراتي",
    "position": "MID",
    "traits": [
      "بطل_العالم",
      "مهاري_جداً",
      "قدم_يسرى"
    ],
    "trophies": [
      "كأس العالم",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_paulo_dybala",
    "name": "باولو ديبالا",
    "aliases": [
      "الجوهرة",
      "ديبالا",
      "لا خويا",
      "dybala",
      "paulo"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "إنسيتوتو",
      "باليرمو",
      "يوفنتوس",
      "روما"
    ],
    "currentClub": "روما",
    "position": "FWD",
    "traits": [
      "بطل_العالم",
      "قدم_يسرى_ساحرة",
      "احتفالية_القناع"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_lorenzo_pellegrini",
    "name": "لورينزو بيليغريني",
    "aliases": [
      "بيليغريني",
      "كابيتانو روما",
      "pellegrini"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "روما",
      "ساسولو",
      "روما"
    ],
    "currentClub": "روما",
    "position": "MID",
    "traits": [
      "قائد",
      "تسديد_رائع",
      "ركلات_حرة"
    ],
    "trophies": [
      "دوري المؤتمر الأوروبي"
    ]
  },
  {
    "id": "p_artem_dovbyk",
    "name": "أرتيم دوفبيك",
    "aliases": [
      "دوفبيك",
      "dovbyk"
    ],
    "nationality": "أوكرانيا",
    "nationalityCode": "UA",
    "clubs": [
      "دنيبرو",
      "ميدتيلاند",
      "جيرونا",
      "روما"
    ],
    "currentClub": "روما",
    "position": "FWD",
    "traits": [
      "هداف_الدوري_الإسباني_السابق",
      "طويل",
      "قوي_بدنياً"
    ],
    "trophies": [
      "هداف الليغا"
    ]
  },
  {
    "id": "p_ademola_lookman",
    "name": "أديمولا لوكمان",
    "aliases": [
      "لوكمان",
      "بطل_الهاتريك",
      "lookman"
    ],
    "nationality": "نيجيريا",
    "nationalityCode": "NG",
    "clubs": [
      "تشارلتون",
      "إيفرتون",
      "لايبزيغ",
      "فولهام",
      "ليستر سيتي",
      "أتالانتا"
    ],
    "currentClub": "أتالانتا",
    "position": "FWD",
    "traits": [
      "هاتريك_نهائي_الدوري_الأوروبي",
      "مراوغ_سريع"
    ],
    "trophies": [
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_mateo_retegui",
    "name": "ماتيو ريتيغي",
    "aliases": [
      "ريتيغي",
      "retegui"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "بوكا جونيورز",
      "إستوديانتيس",
      "تيغري",
      "جنوى",
      "أتالانتا"
    ],
    "currentClub": "أتالانتا",
    "position": "FWD",
    "traits": [
      "هداف_الدوري_الإيطالي",
      "قناص_شباك"
    ],
    "trophies": []
  },
  {
    "id": "p_christian_pulisic",
    "name": "كريستيان بوليسيتش",
    "aliases": [
      "كابتن أمريكا",
      "بوليسيتش",
      "pulisic",
      "captain america"
    ],
    "nationality": "الولايات المتحدة",
    "nationalityCode": "US",
    "clubs": [
      "بوروسيا دورتموند",
      "تشيلسي",
      "ميلان"
    ],
    "currentClub": "ميلان",
    "position": "FWD",
    "traits": [
      "سريع_ومراوغ",
      "بطل_أوروبا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "دوري أمم الكونكاكاف"
    ]
  },
  {
    "id": "p_alvaro_morata",
    "name": "ألفارو موراتا",
    "aliases": [
      "موراتا",
      "morata",
      "alvaro"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال مدريد",
      "يوفنتوس",
      "تشيلسي",
      "أتلتيكو مدريد",
      "ميلان"
    ],
    "currentClub": "ميلان",
    "position": "FWD",
    "traits": [
      "بطل_أوروبا",
      "قائد_إسبانيا",
      "ضربات_رأس"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "كأس أمم أوروبا",
      "الدوري الإسباني",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_mike_maignan",
    "name": "مايك ماينان",
    "aliases": [
      "ماينان",
      "السحر الأسود",
      "maignan",
      "magic mike"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "باريس سان جيرمان",
      "ليل",
      "ميلان"
    ],
    "currentClub": "ميلان",
    "position": "GK",
    "traits": [
      "صد_بلنتيات_خارق",
      "ردات_فعل_مذهلة"
    ],
    "trophies": [
      "الدوري الفرنسي",
      "الدوري الإيطالي",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_tijjani_reijnders",
    "name": "تيجاني رايندرز",
    "aliases": [
      "رايندرز",
      "reijnders"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "بي إي سي زفوله",
      "ألكمار",
      "ميلان"
    ],
    "currentClub": "ميلان",
    "position": "MID",
    "traits": [
      "صانع_ألعاب_هولندي",
      "تمرير_رائع"
    ],
    "trophies": []
  },
  {
    "id": "p_romelu_lukaku",
    "name": "روميلو لوكاكو",
    "aliases": [
      "الدبابة",
      "لوكاكو",
      "الدبابة البلجيكية",
      "lukaku",
      "big rom"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "أندرلخت",
      "تشيلسي",
      "وست بروميتش",
      "إيفرتون",
      "مانشستر يونايتد",
      "إنتر ميلان",
      "تشيلسي",
      "روما",
      "نابولي"
    ],
    "currentClub": "نابولي",
    "position": "FWD",
    "traits": [
      "قوة_بدنية_هائلة",
      "هداف_تاريخي_لبلجيكا"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "كأس العالم للأندية",
      "الدوري البلجيكي"
    ]
  },
  {
    "id": "p_giovanni_di_lorenzo",
    "name": "جوفاني دي لورينزو",
    "aliases": [
      "دي لورينزو",
      "كابيتانو نابولي",
      "di lorenzo"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "ريجينا",
      "إمبولي",
      "نابولي"
    ],
    "currentClub": "نابولي",
    "position": "DEF",
    "traits": [
      "قائد_نابولي",
      "بطل_أوروبا"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_stanislav_lobotka",
    "name": "ستانيسلاف لوبوتكا",
    "aliases": [
      "لوبوتكا",
      "lobotka"
    ],
    "nationality": "سلوفاكيا",
    "nationalityCode": "SK",
    "clubs": [
      "ترينشين",
      "نوردشيلاند",
      "سلتا فيغو",
      "نابولي"
    ],
    "currentClub": "نابولي",
    "position": "MID",
    "traits": [
      "محور_هادئ",
      "دقة_تمرير_عالية"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_serge_gnabry",
    "name": "سيرج غنابري",
    "aliases": [
      "غنابري",
      "الطاهي",
      "gnabry",
      "serge"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "أرسنال",
      "وست بروميتش",
      "فيردر بريمن",
      "هوفنهايم",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "FWD",
    "traits": [
      "تسديد_قوي",
      "سريع",
      "احتفالية_الطبخ"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_kingsley_coman",
    "name": "كينغسلي كومان",
    "aliases": [
      "كومان",
      "تميمة_البطولات",
      "coman"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "باريس سان جيرمان",
      "يوفنتوس",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "FWD",
    "traits": [
      "سجل_هدف_نهائي_الأبطال",
      "بطل_دوري_في_كل_مواسمه_تقريباً"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الفرنسي",
      "الدوري الإيطالي",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_michael_olise",
    "name": "مايكل أوليسيه",
    "aliases": [
      "أوليسيه",
      "olise",
      "michael"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "ريدينغ",
      "كريستال بالاس",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "FWD",
    "traits": [
      "مهاري_يساري",
      "صانع_فرص_بارع",
      "فضية_الأولمبياد"
    ],
    "trophies": [
      "فضية_الأولمبياد"
    ]
  },
  {
    "id": "p_leon_goretzka",
    "name": "ليون غوريتسكا",
    "aliases": [
      "غوريتسكا",
      "الدبابة_الألمانية",
      "goretzka"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "بوخوم",
      "شالكه",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "MID",
    "traits": [
      "بنية_عضلية_خارقة",
      "هداف_وسط"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني",
      "كأس القارات"
    ]
  },
  {
    "id": "p_jonathan_tah",
    "name": "جوناثان تاه",
    "aliases": [
      "تاه",
      "tah",
      "jonathan"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "هامبورغ",
      "فورتونا دوسلدورف",
      "باير ليفركوزن"
    ],
    "currentClub": "باير ليفركوزن",
    "position": "DEF",
    "traits": [
      "عملاق_الدفاع",
      "بطل_الدوري_بلا_هزيمة"
    ],
    "trophies": [
      "الدوري الألماني",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_victor_boniface",
    "name": "فيكتور بونيفاس",
    "aliases": [
      "بونيفاس",
      "boniface"
    ],
    "nationality": "نيجيريا",
    "nationalityCode": "NG",
    "clubs": [
      "بودو غليمت",
      "يونيون سانت جيلواز",
      "باير ليفركوزن"
    ],
    "currentClub": "باير ليفركوزن",
    "position": "FWD",
    "traits": [
      "مهاجم_قوي_وممتع",
      "مهارات_شارع"
    ],
    "trophies": [
      "الدوري الألماني",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_serhou_guirassy",
    "name": "سيرهو غيراسي",
    "aliases": [
      "غيراسي",
      "guirassy"
    ],
    "nationality": "غينيا",
    "nationalityCode": "GN",
    "clubs": [
      "ليل",
      "أوكسير",
      "كولن",
      "أميان",
      "رين",
      "شتوتغارت",
      "بوروسيا دورتموند"
    ],
    "currentClub": "بوروسيا دورتموند",
    "position": "FWD",
    "traits": [
      "هداف_سفاح",
      "إنهاء_خارق"
    ],
    "trophies": []
  },
  {
    "id": "p_julian_brandt",
    "name": "يوليان براندت",
    "aliases": [
      "براندت",
      "brandt",
      "julian"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "باير ليفركوزن",
      "بوروسيا دورتموند"
    ],
    "currentClub": "بوروسيا دورتموند",
    "position": "MID",
    "traits": [
      "صانع_ألعاب_كلاسيكي",
      "لمسات_حريرية"
    ],
    "trophies": [
      "كأس ألمانيا",
      "كأس القارات"
    ]
  },
  {
    "id": "p_gregor_kobel",
    "name": "غريغور كوبيل",
    "aliases": [
      "كوبيل",
      "kobel",
      "gregor"
    ],
    "nationality": "سويسرا",
    "nationalityCode": "CH",
    "clubs": [
      "هوفنهايم",
      "أوغسبورغ",
      "شتوتغارت",
      "بوروسيا دورتموند"
    ],
    "currentClub": "بوروسيا دورتموند",
    "position": "GK",
    "traits": [
      "حارس_ألماني_سويسري_صلب",
      "أفضل_حارس_بالبوندسليغا"
    ],
    "trophies": []
  },
  {
    "id": "p_xavi_simons",
    "name": "تشافي سيمونز",
    "aliases": [
      "سيمونز",
      "تشافي سيمونز",
      "xavi simons"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "برشلونة_شباب",
      "باريس سان جيرمان",
      "أيندهوفن",
      "لايبزيغ"
    ],
    "currentClub": "لايبزيغ",
    "position": "MID",
    "traits": [
      "مراوغ_سريع",
      "تسديد_بعيد",
      "موهبة_شابة"
    ],
    "trophies": [
      "كأس هولندا",
      "كأس السوبر الألماني"
    ]
  },
  {
    "id": "p_lois_openda",
    "name": "لويس أوبيندا",
    "aliases": [
      "أوبيندا",
      "openda",
      "lois"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "كلوب بروج",
      "فيتيسه",
      "لانس",
      "لايبزيغ"
    ],
    "currentClub": "لايبزيغ",
    "position": "FWD",
    "traits": [
      "سريع_جداً",
      "إنهاء_ذكي"
    ],
    "trophies": [
      "كأس السوبر الألماني",
      "الدوري البلجيكي"
    ]
  },
  {
    "id": "p_benjamin_sesko",
    "name": "بنيامين شيشكو",
    "aliases": [
      "شيشكو",
      "هالاند الجديد",
      "sesko",
      "benjamin"
    ],
    "nationality": "سلوفينيا",
    "nationalityCode": "SI",
    "clubs": [
      "سالزبورغ",
      "ليفيرينغ",
      "لايبزيغ"
    ],
    "currentClub": "لايبزيغ",
    "position": "FWD",
    "traits": [
      "طويل_وسريع",
      "تسديد_صاروخي"
    ],
    "trophies": [
      "الدوري النمساوي",
      "كأس السوبر الألماني"
    ]
  },
  {
    "id": "p_bradley_barcola",
    "name": "برادلي باركولا",
    "aliases": [
      "باركولا",
      "barcola",
      "bradley"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "ليون",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "FWD",
    "traits": [
      "سريع_كالبرق",
      "مراوغ_مهاري"
    ],
    "trophies": [
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_warren_zaire_emery",
    "name": "وارن زاير إيمري",
    "aliases": [
      "زاير إيمري",
      "zaire-emery"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "MID",
    "traits": [
      "موهبة_خارقة",
      "نضج_تكتيكي_مبكر"
    ],
    "trophies": [
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_marquinhos",
    "name": "ماركينيوس",
    "aliases": [
      "ماركينيوس",
      "كابيتانو باريس",
      "marquinhos"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "كورينثيانز",
      "روما",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "DEF",
    "traits": [
      "قائد_باريس",
      "أكثر_من_حقق_ألقاب_مع_باريس"
    ],
    "trophies": [
      "كوبا أمريكا",
      "الدوري الفرنسي",
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_vitinha_psg",
    "name": "فيتينيا",
    "aliases": [
      "فيتينيا",
      "مهندس باريس",
      "vitinha"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "بورتو",
      "وولفرهامبتون",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "MID",
    "traits": [
      "مايسترو_وسط",
      "التحكم_بالنسق"
    ],
    "trophies": [
      "الدوري البرتغالي",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_nuno_mendes",
    "name": "نونو مينديز",
    "aliases": [
      "مينديز",
      "نونو",
      "nuno mendes"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "سبورتينغ لشبونة",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "DEF",
    "traits": [
      "أسرع_ظهير_أيسر",
      "مهاري_جداً"
    ],
    "trophies": [
      "الدوري البرتغالي",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_fabian_ruiz",
    "name": "فابيان رويز",
    "aliases": [
      "رويز",
      "فابيان",
      "fabian ruiz"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال بيتيس",
      "إلتشي",
      "نابولي",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "MID",
    "traits": [
      "بطل_أوروبا",
      "قدم_يسرى_ساحرة",
      "أهداف_باليورو"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الفرنسي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_jonathan_david",
    "name": "جوناثان ديفيد",
    "aliases": [
      "ديفيد",
      "الهداف الكندي",
      "jonathan david"
    ],
    "nationality": "كندا",
    "nationalityCode": "CA",
    "clubs": [
      "جينت",
      "ليل"
    ],
    "currentClub": "ليل",
    "position": "FWD",
    "traits": [
      "هداف_ليل_التاريخي",
      "إنهاء_بالقدمين"
    ],
    "trophies": [
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_alexandre_lacazette",
    "name": "ألكسندر لاكازيت",
    "aliases": [
      "لاكازيت",
      "الجنرال",
      "lacazette"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "ليون",
      "أرسنال",
      "ليون"
    ],
    "currentClub": "ليون",
    "position": "FWD",
    "traits": [
      "قائد_ليون",
      "هداف"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي",
      "كأس فرنسا"
    ]
  },
  {
    "id": "p_mason_greenwood",
    "name": "مايسون غرينوود",
    "aliases": [
      "غرينوود",
      "greenwood",
      "mason"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "مانشستر يونايتد",
      "خيتافي",
      "مارسيليا"
    ],
    "currentClub": "مارسيليا",
    "position": "FWD",
    "traits": [
      "إنهاء_خارق_بالقدمين_معاً",
      "تسديد_متقن"
    ],
    "trophies": []
  },
  {
    "id": "p_angel_di_maria",
    "name": "أنخيل دي ماريا",
    "aliases": [
      "فيديو",
      "الشعيرية",
      "دي ماريا",
      "di maria",
      "angel"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "روزاريو سنترال",
      "بنفيكا",
      "ريال مدريد",
      "مانشستر يونايتد",
      "باريس سان جيرمان",
      "يوفنتوس",
      "بنفيكا"
    ],
    "currentClub": "بنفيكا",
    "position": "FWD",
    "traits": [
      "رجل_النهائيات_التاريخي",
      "بطل_العالم",
      "لوب_خالد"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "كوبا أمريكا",
      "الدوري الإسباني",
      "الدوري الفرنسي",
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_nicolas_otamendi",
    "name": "نيكولاس أوتاميندي",
    "aliases": [
      "أوتاميندي",
      "المحارب الأرجنتيني",
      "otamendi"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "فيليز سارسفيلد",
      "بورتو",
      "أتلتيكو مينيرو",
      "فالنسيا",
      "مانشستر سيتي",
      "بنفيكا"
    ],
    "currentClub": "بنفيكا",
    "position": "DEF",
    "traits": [
      "بطل_العالم",
      "مقاتل",
      "قائد"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا",
      "الدوري الإنجليزي",
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_viktor_gyokeres",
    "name": "فيكتور جيوكيريس",
    "aliases": [
      "جيوكيريس",
      "القناع السويدي",
      "gyokeres",
      "viktor"
    ],
    "nationality": "السويد",
    "nationalityCode": "SE",
    "clubs": [
      "برومابويكارنا",
      "برايتون",
      "سانت باولي",
      "سوانزي سيتي",
      "كوفنتري سيتي",
      "سبورتينغ لشبونة"
    ],
    "currentClub": "سبورتينغ لشبونة",
    "position": "FWD",
    "traits": [
      "آلة_أهداف",
      "قوي_وسريع_جداً",
      "احتفالية_القناع"
    ],
    "trophies": [
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_diogo_costa",
    "name": "ديوغو كوستا",
    "aliases": [
      "كوستا",
      "صائد البلنتيات",
      "diogo costa"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "بورتو"
    ],
    "currentClub": "بورتو",
    "position": "GK",
    "traits": [
      "تصدى_لثلاث_بلنتيات_باليورو",
      "حارس_عالمي"
    ],
    "trophies": [
      "الدوري البرتغالي",
      "كأس البرتغال"
    ]
  },
  {
    "id": "p_luis_suarez",
    "name": "لويس سواريز",
    "aliases": [
      "إل بيستوليرو",
      "سواريز",
      "العضاض",
      "suarez",
      "luis"
    ],
    "nationality": "الأوروغواي",
    "nationalityCode": "UY",
    "clubs": [
      "ناسيونال",
      "غرونينغن",
      "أياكس",
      "ليفربول",
      "برشلونة",
      "أتلتيكو مدريد",
      "ناسيونال",
      "غريميو",
      "إنتر ميامي"
    ],
    "currentClub": "إنتر ميامي",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هداف_سفاح",
      "الحذاء_الذهبي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "كوبا أمريكا",
      "الدوري الإسباني",
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_sergio_busquets",
    "name": "سيرجيو بوسكيتس",
    "aliases": [
      "بوسكيتس",
      "الأخطبوط",
      "ضابط الإيقاع",
      "busquets"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة",
      "إنتر ميامي"
    ],
    "currentClub": "إنتر ميامي",
    "position": "MID",
    "traits": [
      "أسطورة",
      "أفضل_محور_تاريخياً",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_jordi_alba",
    "name": "جوردي ألبا",
    "aliases": [
      "ألبا",
      "الصاروخ الإسباني",
      "jordi alba"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "خيمناستيك",
      "فالنسيا",
      "برشلونة",
      "إنتر ميامي"
    ],
    "currentClub": "إنتر ميامي",
    "position": "DEF",
    "traits": [
      "سريع_جداً",
      "ثنائية_ميسي_الشهيرة",
      "بطل_أوروبا"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_olivier_giroud",
    "name": "أوليفييه جيرو",
    "aliases": [
      "جيرو",
      "العقرب",
      "giroud",
      "olivier"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "غرونوبل",
      "إيستر",
      "تور",
      "مونبلييه",
      "أرسنال",
      "تشيلسي",
      "ميلان",
      "لوس أنجلوس إف سي"
    ],
    "currentClub": "لوس أنجلوس إف سي",
    "position": "FWD",
    "traits": [
      "هداف_فرنسا_التاريخي",
      "بطل_العالم",
      "أهداف_بهلوانية"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_keylor_navas",
    "name": "كيلور نافاس",
    "aliases": [
      "نافاس",
      "حامي العرين الكوستاريكي",
      "keylor navas"
    ],
    "nationality": "كوستاريكا",
    "nationalityCode": "CR",
    "clubs": [
      "سابريسا",
      "ألباسيتي",
      "ليفانتي",
      "ريال مدريد",
      "باريس سان جيرمان",
      "نوتينغهام فورست"
    ],
    "currentClub": "حر",
    "position": "GK",
    "traits": [
      "ثلاثية_أبطال_متتالية",
      "حارس_تاريخي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_james_rodriguez",
    "name": "خاميس رودريغيز",
    "aliases": [
      "خاميس",
      "هداف المونديال",
      "james",
      "rodriguez"
    ],
    "nationality": "كولومبيا",
    "nationalityCode": "CO",
    "clubs": [
      "إنفيغادو",
      "بانفيلد",
      "بورتو",
      "موناكو",
      "ريال مدريد",
      "بايرن ميونخ",
      "إيفرتون",
      "الريان",
      "أولمبياكوس",
      "ساو باولو",
      "رايو فايكانو"
    ],
    "currentClub": "رايو فايكانو",
    "position": "MID",
    "traits": [
      "هدف_بوشكاش",
      "قدم_يسرى_ساحرة",
      "أفضل_لاعب_بكوبا_أمريكا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الألماني",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_pele",
    "name": "بيليه",
    "aliases": [
      "الملك",
      "إدسون أرانتيس",
      "pele",
      "o rei"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "سانتوس",
      "نيويورك كوزموس"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "3_كؤوس_عالم",
      "ملك_كرة_القدم"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا ليبرتادوريس",
      "كأس الإنتركونتيننتال"
    ]
  },
  {
    "id": "p_diego_maradona",
    "name": "دييغو مارادونا",
    "aliases": [
      "الأسطورة",
      "يد الله",
      "دييغو",
      "maradona",
      "diego"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "أرجنتينوس جونيورز",
      "بوكا جونيورز",
      "برشلونة",
      "نابولي",
      "إشبيلية",
      "نيولز أولد بويز",
      "بوكا جونيورز"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "هدف_القرن",
      "بطل_العالم",
      "معشوق_نابولي"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الإيطالي",
      "كأس الاتحاد الأوروبي",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_zinedine_zidane",
    "name": "زين الدين زيدان",
    "aliases": [
      "زيزو",
      "المايسترو الفرنسي",
      "zidane",
      "zizou"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "كان",
      "بوردو",
      "يوفنتوس",
      "ريال مدريد"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية",
      "بطل_العالم",
      "هدف_هامبدن_بارك"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "الدوري الإسباني",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_ronaldo_nazario",
    "name": "رونالدو الظاهرة",
    "aliases": [
      "الظاهرة",
      "رونالدو البرازيلي",
      "R9",
      "ronaldo nazario",
      "el fenomeno"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "كروزيرو",
      "أيندهوفن",
      "برشلونة",
      "إنتر ميلان",
      "ريال مدريد",
      "ميلان",
      "كورينثيانز"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "أعظم_مهاجم_في_التاريخ",
      "الكرة_الذهبية",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا",
      "الكرة الذهبية",
      "الدوري الإسباني",
      "كأس الكؤوس الأوروبية"
    ]
  },
  {
    "id": "p_ronaldinho",
    "name": "رونالدينيو",
    "aliases": [
      "الساحر",
      "روني",
      "رونالدينيو غاوتشو",
      "ronaldinho",
      "dinho"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "غريميو",
      "باريس سان جيرمان",
      "برشلونة",
      "ميلان",
      "فلامنغو",
      "أتلتيكو مينيرو",
      "كيريتارو",
      "فلومينينسي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "سحر_خالص",
      "الكرة_الذهبية",
      "بطل_العالم",
      "تصفيق_البيرنابيو"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "كوبا أمريكا",
      "كوبا ليبرتادوريس",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_rivaldo",
    "name": "ريفالدو",
    "aliases": [
      "ريفالدو",
      "مقصية_فالنسيا",
      "rivaldo"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "سانتا كروز",
      "موغي ميريم",
      "كورينثيانز",
      "بالميراس",
      "ديبورتيفو لاكورونيا",
      "برشلونة",
      "ميلان",
      "كروزيرو",
      "أولمبياكوس",
      "أيك أثينا",
      "بونيودكور",
      "ساو باولو",
      "كابوسكورب",
      "ساو كايتانو"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية",
      "بطل_العالم",
      "تسديدات_خرافية"
    ],
    "trophies": [
      "كأس العالم",
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_paolo_maldini",
    "name": "باولو مالديني",
    "aliases": [
      "إل كابيتانو",
      "مالديني",
      "maldini",
      "paolo"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "ميلان"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "وفاء_الميلان_الأبدي",
      "أعظم_مدافع_تاريخياً",
      "5_أبطال_أوروبا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "كأس السوبر الأوروبي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_franco_baresi",
    "name": "فرانكو باريزي",
    "aliases": [
      "باريزي",
      "كايزر ميلانو",
      "baresi",
      "franco"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "ميلان"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "قائد_الميلان_التاريخي",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_alessandro_nesta",
    "name": "أليساندرو نيستا",
    "aliases": [
      "نيستا",
      "الأنيق",
      "تدخل_المسطرة",
      "nesta"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "لاتسيو",
      "ميلان",
      "مونتريال إمباكت",
      "تشينايين"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "أناقة_الدفاع_الإيطالي",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_fabio_cannavaro",
    "name": "فابيو كانافارو",
    "aliases": [
      "سور برلين",
      "كانافارو",
      "cannavaro",
      "fabio"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "نابولي",
      "بارما",
      "إنتر ميلان",
      "يوفنتوس",
      "ريال مدريد",
      "يوفنتوس",
      "الأهلي الإماراتي"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "مدافع_حقق_الكرة_الذهبية",
      "قائد_بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "الكرة الذهبية",
      "الدوري الإسباني",
      "كأس الاتحاد الأوروبي"
    ]
  },
  {
    "id": "p_roberto_carlos",
    "name": "روبرتو كارلوس",
    "aliases": [
      "المدفعجي",
      "كارلوس",
      "صاحبة_الفيزياء_المستحيلة",
      "roberto carlos"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "أونياو ساو جواو",
      "بالميراس",
      "إنتر ميلان",
      "ريال مدريد",
      "فنربخشة",
      "كورينثيانز",
      "أنجي ماخاتشكالا",
      "دلهي ديناموز"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "أقوى_قدم_يسرى_بالتاريخ",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_cafu",
    "name": "كافو",
    "aliases": [
      "القطار السريع",
      "كافو",
      "ماركوس إيفانجيليستا",
      "cafu"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "ساو باولو",
      "ريال سرقسطة",
      "يوفينتودي",
      "بالميراس",
      "روما",
      "ميلان"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "3_نهائيات_مونديال_متتالية",
      "قائد_السامبا_2002"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "كوبا أمريكا",
      "الدوري الإيطالي",
      "كوبا ليبرتادوريس"
    ]
  },
  {
    "id": "p_kaka",
    "name": "ريكاردو كاكا",
    "aliases": [
      "كاكا",
      "الأمير البرازيلي",
      "kaka",
      "ricardo"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "ساو باولو",
      "ميلان",
      "ريال مدريد",
      "ميلان",
      "ساو باولو",
      "أورلاندو سيتي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية",
      "بطل_العالم",
      "انطلاقات_مدمرة"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "الدوري الإيطالي",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_andrea_pirlo",
    "name": "أندريا بيرلو",
    "aliases": [
      "المايسترو",
      "المهندس",
      "بيرلو",
      "pirlo",
      "andrea"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "بريشيا",
      "إنتر ميلان",
      "ريجينا",
      "ميلان",
      "يوفنتوس",
      "نيويورك سيتي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "تمريرات_حريرية",
      "ركلات_حرة_قاتلة",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_francesco_totti",
    "name": "فرانشيسكو توتي",
    "aliases": [
      "ملك روما",
      "توتي",
      "إل كابيتانو",
      "totti",
      "francesco"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "روما"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "وفاء_تاريخي_لناد_واحد",
      "بطل_العالم",
      "لمسات_سحرية"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الإيطالي",
      "كأس إيطاليا",
      "الحذاء الذهبي الأوروبي"
    ]
  },
  {
    "id": "p_alessandro_del_piero",
    "name": "أليساندرو ديل بييرو",
    "aliases": [
      "بينتوريكيو",
      "ديل بييرو",
      "ملك_تورينو",
      "del piero",
      "alessandro"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "بادوفا",
      "يوفنتوس",
      "سيدني",
      "دلهي ديناموز"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "منطقة_ديل_بييرو_الشهيرة",
      "بطل_العالم",
      "قائد"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_gianluigi_buffon",
    "name": "جانلويجي بوفون",
    "aliases": [
      "جيجي",
      "بوفون",
      "أخطبوط_إيطاليا",
      "buffon",
      "gigi"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "بارما",
      "يوفنتوس",
      "باريس سان جيرمان",
      "يوفنتوس",
      "بارما"
    ],
    "currentClub": "معتزل",
    "position": "GK",
    "traits": [
      "أسطورة",
      "أعظم_حارس_في_التاريخ",
      "بطل_العالم",
      "استمرارية_مذهلة"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الإيطالي",
      "الدوري الفرنسي",
      "كأس الاتحاد الأوروبي"
    ]
  },
  {
    "id": "p_iker_casillas",
    "name": "إيكر كاسياس",
    "aliases": [
      "القديس",
      "كاسياس",
      "سان إيكر",
      "casillas",
      "iker"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال مدريد",
      "بورتو"
    ],
    "currentClub": "معتزل",
    "position": "GK",
    "traits": [
      "أسطورة",
      "قائد_إسبانيا_الذهبي",
      "بطل_العالم",
      "صدات_إعجازية"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_carles_puyol",
    "name": "كارليس بويول",
    "aliases": [
      "قلب الأسد",
      "بويول",
      "الكابيتانو",
      "puyol",
      "carles"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "روح_القتال_المطلقة",
      "قائد",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_xavi_hernandez",
    "name": "تشافي هيرنانديز",
    "aliases": [
      "المايسترو",
      "تشافي",
      "زرقاء اليمامة",
      "xavi",
      "hernandez"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة",
      "السد"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "عقل_التيكي_تاكا",
      "بطل_العالم",
      "دوران_360_درجة"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_andres_iniesta",
    "name": "أندريس إنييستا",
    "aliases": [
      "الرسام",
      "إنييستا",
      "دون أندريس",
      "iniesta",
      "andres"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة",
      "فيسيل كوبه",
      "الإمارات"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "صاحب_هدف_نهائي_المونديال",
      "سحر_المراوغة_والتمرير"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_sergio_ramos",
    "name": "سيرجيو راموس",
    "aliases": [
      "الكابيتانو",
      "راموس",
      "رأسية_92:48",
      "ramos",
      "sergio"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "إشبيلية",
      "ريال مدريد",
      "باريس سان جيرمان",
      "إشبيلية"
    ],
    "currentClub": "حر",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "مدافع_هداف_تاريخي",
      "قائد_الريال",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_david_beckham",
    "name": "ديفيد بيكهام",
    "aliases": [
      "بيكهام",
      "بيكس",
      "سيد الضربات الحرة",
      "beckham",
      "david"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "مانشستر يونايتد",
      "بريستون",
      "مانشستر يونايتد",
      "ريال مدريد",
      "لوس أنجلوس غالاكسي",
      "ميلان",
      "باريس سان جيرمان"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "أدق_عرضيات_بالتاريخ",
      "ركلات_حرة_مستحيلة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الإسباني",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_thierry_henry",
    "name": "تييري هنري",
    "aliases": [
      "الغزال الفرنسي",
      "هنري",
      "تيتي",
      "henry",
      "thierry"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "موناكو",
      "يوفنتوس",
      "أرسنال",
      "برشلونة",
      "نيويورك ريد بولز"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "سرعة_وإنهاء_خرافي",
      "بطل_العالم",
      "دوري_اللاهزيمة"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_dennis_bergkamp",
    "name": "دينيس بيركامب",
    "aliases": [
      "الهولندي غير الطائر",
      "بيركامب",
      "bergkamp",
      "dennis"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أياكس",
      "إنتر ميلان",
      "أرسنال"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "كنترول_من_كوكب_آخر",
      "أهداف_تاريخية"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "كأس الاتحاد الأوروبي",
      "كأس الكؤوس الأوروبية"
    ]
  },
  {
    "id": "p_steven_gerrard",
    "name": "ستيفن جيرارد",
    "aliases": [
      "ستيفي جي",
      "جيرارد",
      "كابتن ليفربول",
      "gerrard",
      "steven"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "ليفربول",
      "لوس أنجلوس غالاكسي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "قائد_معجزة_إسطنبول",
      "تسديدات_صاروخية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "كأس الاتحاد الأوروبي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_frank_lampard",
    "name": "فرانك لامبارد",
    "aliases": [
      "سوبر فرانك",
      "لامبارد",
      "lampard",
      "frank"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "وست هام",
      "سوانزي سيتي",
      "تشيلسي",
      "مانشستر سيتي",
      "نيويورك سيتي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "هداف_تشيلسي_التاريخي",
      "قادم_من_الخلف"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_paul_scholes",
    "name": "بول سكولز",
    "aliases": [
      "الجزار الصامت",
      "سكولز",
      "الأشقر",
      "scholes",
      "paul"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "مانشستر يونايتد"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "تمرير_طويل_بالمليمتر",
      "تسديد_مدمر"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_wayne_rooney",
    "name": "واين روني",
    "aliases": [
      "الغولدمان",
      "الفتى الذهبي",
      "روني",
      "rooney",
      "wayne"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "إيفرتون",
      "مانشستر يونايتد",
      "إيفرتون",
      "دي سي يونايتد",
      "ديربي كاونتي"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هداف_مانشستر_يونايتد_التاريخي",
      "قتالي_وشرس"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_ryan_giggs",
    "name": "ريان غيغز",
    "aliases": [
      "الجناح الطائر",
      "غيغز",
      "giggs",
      "ryan"
    ],
    "nationality": "ويلز",
    "nationalityCode": "GB",
    "clubs": [
      "مانشستر يونايتد"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "أكثر_من_لعب_بالبريميرليغ",
      "13_لقب_دوري"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_arjen_robben",
    "name": "آريين روبن",
    "aliases": [
      "روبن",
      "صاحب_الحركة_الوحيدة_التي_لا_تصد",
      "robben",
      "arjen"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "غرونينغن",
      "أيندهوفن",
      "تشيلسي",
      "ريال مدريد",
      "بايرن ميونخ",
      "غرونينغن"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "قطع_للعمق_وتسديد_يساري_خارق",
      "سريع_جداً"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني",
      "الدوري الإنجليزي",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_franck_ribery",
    "name": "فرانك ريبيري",
    "aliases": [
      "بلال",
      "ريبيري",
      "الوجه_المشوه",
      "ribery",
      "franck"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "بولون",
      "أولمبيك أليس",
      "بريست",
      "ميتز",
      "غلطة سراي",
      "مارسيليا",
      "بايرن ميونخ",
      "فيورنتينا",
      "ساليرنيتانا"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "سريع_ومراوغ",
      "ثنائية_روبيري_الشهيرة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_didier_drogba",
    "name": "ديدييه دروغبا",
    "aliases": [
      "الفيل الإيفواري",
      "دروغبا",
      "مرعب_أرسنال",
      "drogba",
      "didier"
    ],
    "nationality": "ساحل العاج",
    "nationalityCode": "CI",
    "clubs": [
      "لومان",
      "غانغون",
      "مارسيليا",
      "تشيلسي",
      "شنغهاي شينهوا",
      "غلطة سراي",
      "تشيلسي",
      "مونتريال إمباكت",
      "فينيكس رايزينغ"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "رجل_النهائيات_المرعب",
      "قوة_بدنية_كاسحة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_samuel_etoo",
    "name": "صامويل إيتو",
    "aliases": [
      "الأسد الكاميروني",
      "إيتو",
      "etoo",
      "samuel"
    ],
    "nationality": "الكاميرون",
    "nationalityCode": "CM",
    "clubs": [
      "ليغانيس",
      "ريال مدريد",
      "إسبانيول",
      "مايوركا",
      "برشلونة",
      "إنتر ميلان",
      "أنجي ماخاتشكالا",
      "تشيلسي",
      "إيفرتون",
      "سامبدوريا",
      "أنطاليا سبور",
      "قونيا سبور",
      "قطر إس سي"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "ثلاثيتان_تاريخيتان_متتاليتان",
      "هداف_أفريقيا_التاريخي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الإيطالي",
      "كأس أمم أفريقيا",
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_yaya_toure",
    "name": "يايا توريه",
    "aliases": [
      "توريه",
      "العملاق",
      "yaya toure",
      "yaya"
    ],
    "nationality": "ساحل العاج",
    "nationalityCode": "CI",
    "clubs": [
      "أسيك ميموزا",
      "بيفيرين",
      "ميتالورغ دونيتسك",
      "أولمبياكوس",
      "موناكو",
      "برشلونة",
      "مانشستر سيتي",
      "أولمبياكوس",
      "تشينغداو هوانغهاي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "انطلاقات_بدنية_لا_توقف",
      "أفضل_لاعب_بأفريقيا_4_مرات"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الإسباني",
      "كأس أمم أفريقيا"
    ]
  },
  {
    "id": "p_george_weah",
    "name": "جورج وياه",
    "aliases": [
      "الملك جورج",
      "وياه",
      "الرئيس",
      "george weah"
    ],
    "nationality": "ليبيريا",
    "nationalityCode": "LR",
    "clubs": [
      "تونير ياوندي",
      "موناكو",
      "باريس سان جيرمان",
      "ميلان",
      "تشيلسي",
      "مانشستر سيتي",
      "مارسيليا",
      "الجزيرة الإماراتي"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "الأفريقي_الوحيد_صاحب_الكرة_الذهبية",
      "هدف_من_المرمى_للمرمى"
    ],
    "trophies": [
      "الكرة الذهبية",
      "الدوري الإيطالي",
      "الدوري الفرنسي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_johan_cruyff",
    "name": "يوهان كرويف",
    "aliases": [
      "عراب الكرة الشاملة",
      "كرويف",
      "cruyff",
      "johan"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أياكس",
      "برشلونة",
      "لوس أنجلوس أزتيكس",
      "واشنطن دبلوماتس",
      "ليفانتي",
      "أياكس",
      "فينورد"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "مؤسس_كرة_القدم_الحديثة",
      "3_كرات_ذهبية"
    ],
    "trophies": [
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_franz_beckenbauer",
    "name": "فرانز بكنباور",
    "aliases": [
      "القيصر",
      "بكنباور",
      "beckenbauer",
      "franz"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "بايرن ميونخ",
      "نيويورك كوزموس",
      "هامبورغ"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "مخترع_الليبرو",
      "بطل_العالم_كلاعب_ومدرب",
      "الكرة_الذهبية"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "كأس أمم أوروبا",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_gerd_muller",
    "name": "غيرد مولر",
    "aliases": [
      "المدفعجي",
      "البومبر",
      "muller",
      "gerd"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "نوردلينغن",
      "بايرن ميونخ",
      "فورت لاودرديل سترايكرز"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "أعظم_قناص_شباك_بالتاريخ",
      "بطل_العالم",
      "الكرة_الذهبية"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "كأس أمم أوروبا",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_marco_van_basten",
    "name": "ماركو فان باستن",
    "aliases": [
      "فان باستن",
      "أعظم_مهاجم_متكامل",
      "هدف_نهائي_88",
      "van basten"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أياكس",
      "ميلان"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "3_كرات_ذهبية",
      "هدف_اليورو_الخالد"
    ],
    "trophies": [
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "كأس أمم أوروبا",
      "الدوري الإيطالي",
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_ruud_gullit",
    "name": "رود خوليت",
    "aliases": [
      "خوليت",
      "الجدائل الذهبية",
      "gullit",
      "ruud"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "هارلم",
      "فينورد",
      "أيندهوفن",
      "ميلان",
      "سامبدوريا",
      "ميلان",
      "تشيلسي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "جوكر_الكرة_الشاملة",
      "الكرة_الذهبية"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الكرة الذهبية",
      "الدوري الإيطالي",
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_frank_rijkaard",
    "name": "فرانك ريكارد",
    "aliases": [
      "ريكارد",
      "المحور التاريخي",
      "rijkaard",
      "frank"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أياكس",
      "ريال سرقسطة",
      "ميلان",
      "أياكس"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "محور_ميلان_الذهبي",
      "بطل_أوروبا"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_gabriel_batistuta",
    "name": "غابرييل باتيستوتا",
    "aliases": [
      "باتي غول",
      "باتيستوتا",
      "batistuta",
      "batigol"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "نيولز أولد بويز",
      "ريفر بليت",
      "بوكا جونيورز",
      "فيورنتينا",
      "روما",
      "إنتر ميلان",
      "العربي القطري"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "صواريخ_شباك_لا_ترحم",
      "احتفالية_الرشاش"
    ],
    "trophies": [
      "كوبا أمريكا",
      "الدوري الإيطالي",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_javier_zanetti",
    "name": "خافيير زانيتي",
    "aliases": [
      "إل تراكتر",
      "الجرار",
      "زانيتي",
      "كابيتانو الإنتر",
      "zanetti"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "تاليريس",
      "بانفيلد",
      "إنتر ميلان"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "وفاء_تاريخي",
      "قائد_الثلاثية",
      "لياقة_حديدية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "كأس الاتحاد الأوروبي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_clarence_seedorf",
    "name": "كلارنس سيدورف",
    "aliases": [
      "سيدورف",
      "رجل الأبطال الثلاثي",
      "seedorf"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أياكس",
      "سامبدوريا",
      "ريال مدريد",
      "إنتر ميلان",
      "ميلان",
      "بوتافوغو"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "الوحيد_الفائز_بالأبطال_مع_3_أندية_مختلفة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الإيطالي",
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_patrick_vieira",
    "name": "باتريك فييرا",
    "aliases": [
      "فييرا",
      "قائد اللاهزيمة",
      "vieira",
      "patrick"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "كان",
      "ميلان",
      "أرسنال",
      "يوفنتوس",
      "إنتر ميلان",
      "مانشستر سيتي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "قائد_أرسنال_الذهبي",
      "بطل_العالم",
      "قوة_وسط_جبارة"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "الدوري الإنجليزي",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_andriy_shevchenko",
    "name": "أندري شيفتشينكو",
    "aliases": [
      "شيفا",
      "شيفتشينكو",
      "القطار الأوكراني",
      "shevchenko",
      "sheva"
    ],
    "nationality": "أوكرانيا",
    "nationalityCode": "UA",
    "clubs": [
      "دينامو كييف",
      "ميلان",
      "تشيلسي",
      "ميلان",
      "دينامو كييف"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية",
      "جلاد_الديربي"
    ],
    "trophies": [
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_pavel_nedved",
    "name": "بافل نيدفيد",
    "aliases": [
      "المدفع التشيكي",
      "نيدفيد",
      "nedved",
      "pavel"
    ],
    "nationality": "التشيك",
    "nationalityCode": "CZ",
    "clubs": [
      "دوكلا براغ",
      "سبارتا براغ",
      "لاتسيو",
      "يوفنتوس"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية",
      "شعر_أشقر_وتسديد_صاروخي"
    ],
    "trophies": [
      "الكرة الذهبية",
      "الدوري الإيطالي",
      "كأس الكؤوس الأوروبية"
    ]
  },
  {
    "id": "p_peter_schmeichel",
    "name": "بيتر شمايكل",
    "aliases": [
      "العملاق الدنماركي",
      "شمايكل",
      "schmeichel",
      "peter"
    ],
    "nationality": "الدنمارك",
    "nationalityCode": "DK",
    "clubs": [
      "غلادساكس",
      "هفيدوفر",
      "بروندبي",
      "مانشستر يونايتد",
      "سبورتينغ لشبونة",
      "أستون فيلا",
      "مانشستر سيتي"
    ],
    "currentClub": "معتزل",
    "position": "GK",
    "traits": [
      "أسطورة",
      "قائد_معجزة_يورو_92",
      "حارس_تاريخي_للشياطين"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي"
    ]
  },
  {
    "id": "p_petr_cech",
    "name": "بيتر تشيك",
    "aliases": [
      "تشيك",
      "صاحب الخوذة",
      "cech",
      "petr"
    ],
    "nationality": "التشيك",
    "nationalityCode": "CZ",
    "clubs": [
      "خمل بلشاني",
      "سبارتا براغ",
      "رين",
      "تشيلسي",
      "أرسنال"
    ],
    "currentClub": "معتزل",
    "position": "GK",
    "traits": [
      "أسطورة",
      "أكثر_شباك_نظيفة_بالبريميرليغ",
      "بطل_أوروبا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_ruud_van_nistelrooy",
    "name": "رود فان نيستلروي",
    "aliases": [
      "فان نيستلروي",
      "قناص منطقة الجزاء",
      "van nistelrooy",
      "ruud"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "دين بوش",
      "هيرنفين",
      "أيندهوفن",
      "مانشستر يونايتد",
      "ريال مدريد",
      "هامبورغ",
      "مالقا"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هداف_الدوري_في_3_دول",
      "إنهاء_لا_يخطئ"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "الدوري الإسباني",
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_raul_gonzalez",
    "name": "راؤول غونزاليس",
    "aliases": [
      "راؤول",
      "روح مدريد",
      "راؤول بلانكو",
      "raul"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال مدريد",
      "شالكه",
      "السد",
      "نيويورك كوزموس"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "رمز_الملكي_الأبدي",
      "تقبيل_الخاتم"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_fernando_torres",
    "name": "فيرناندو توريس",
    "aliases": [
      "إل نينيو",
      "توريس",
      "النينيو",
      "torres",
      "fernando"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "أتلتيكو مدريد",
      "ليفربول",
      "تشيلسي",
      "ميلان",
      "أتلتيكو مدريد",
      "ساغان توسو"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هدف_يورو_2008",
      "بطل_العالم",
      "سريع"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_david_villa",
    "name": "دافيد فيا",
    "aliases": [
      "الكواخي",
      "فيا",
      "الهداف الإسباني التاريخي",
      "villa",
      "david"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "سبورتينغ خيخون",
      "ريال سرقسطة",
      "فالنسيا",
      "برشلونة",
      "أتلتيكو مدريد",
      "ملبورن سيتي",
      "نيويورك سيتي",
      "فيسيل كوبه"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هداف_إسبانيا_التاريخي",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_xabi_alonso",
    "name": "تشابي ألونسو",
    "aliases": [
      "البروفيسور",
      "ألونسو",
      "xabi alonso"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال سوسيداد",
      "إيبار",
      "ليفربول",
      "ريال مدريد",
      "بايرن ميونخ"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "تمريرات_طويلة_إعجازية",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_mohamed_aboutrika",
    "name": "محمد أبو تريكة",
    "aliases": [
      "أمير القلوب",
      "أبو تريكة",
      "الماجيكو",
      "aboutrika"
    ],
    "nationality": "مصر",
    "nationalityCode": "EG",
    "clubs": [
      "الترسانة",
      "الأهلي المصري",
      "بني ياس"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "ساحر_أفريقيا",
      "هداف_النهائيات_الحاسم"
    ],
    "trophies": [
      "كأس أمم أفريقيا",
      "دوري أبطال أفريقيا",
      "برونزية_كأس_العالم_للأندية"
    ]
  },
  {
    "id": "p_essam_hadary",
    "name": "عصام الحضري",
    "aliases": [
      "السد العالي",
      "الحضري",
      "el hadary"
    ],
    "nationality": "مصر",
    "nationalityCode": "EG",
    "clubs": [
      "دمياط",
      "الأهلي المصري",
      "سيون",
      "الإسماعيلي",
      "الزمالك",
      "المريخ السوداني",
      "الاتحاد السكندري",
      "وادي دجلة",
      "التعاون",
      "النجوم"
    ],
    "currentClub": "معتزل",
    "position": "GK",
    "traits": [
      "أسطورة",
      "أكبر_لاعب_شارك_بالمونديال",
      "4_كؤوس_أمم_أفريقيا",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس أمم أفريقيا",
      "دوري أبطال أفريقيا"
    ]
  },
  {
    "id": "p_hossam_hassan",
    "name": "حسام حسن",
    "aliases": [
      "العميد",
      "حسام حسن",
      "hossam hassan"
    ],
    "nationality": "مصر",
    "nationalityCode": "EG",
    "clubs": [
      "الأهلي المصري",
      "باوك",
      "نيوشاتل زاماكس",
      "الزمالك",
      "المصري",
      "الترسانة",
      "الاتحاد السكندري"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هداف_مصر_التاريخي",
      "روح_قتالية_نارية"
    ],
    "trophies": [
      "كأس أمم أفريقيا",
      "دوري أبطال أفريقيا",
      "الدوري المصري"
    ]
  },
  {
    "id": "p_mahmoud_khatib",
    "name": "محمود الخطيب",
    "aliases": [
      "بيبو",
      "الخطيب",
      "el khatib"
    ],
    "nationality": "مصر",
    "nationalityCode": "EG",
    "clubs": [
      "الأهلي المصري"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية_الأفريقية",
      "أعظم_موهبة_مصرية"
    ],
    "trophies": [
      "كأس أمم أفريقيا",
      "دوري أبطال أفريقيا",
      "الكرة الذهبية الأفريقية"
    ]
  },
  {
    "id": "p_mesut_ozil",
    "name": "مسعود أوزيل",
    "aliases": [
      "عازف الليل",
      "أوزيل",
      "ozil",
      "mesut"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "شالكه",
      "فيردر بريمن",
      "ريال مدريد",
      "أرسنال",
      "فنربخشة",
      "باشاك شهير"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "تمريرات_ساحرة",
      "بطل_العالم"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الإسباني",
      "كأس إنجلترا"
    ]
  },
  {
    "id": "p_eden_hazard",
    "name": "إيدين هازارد",
    "aliases": [
      "هازارد",
      "الساحر البلجيكي",
      "hazard",
      "eden"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "ليل",
      "تشيلسي",
      "ريال مدريد"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "مراوغ_عالمي",
      "الدوري_الإنجليزي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الإسباني",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_gareth_bale",
    "name": "غاريث بيل",
    "aliases": [
      "النفاثة الويلزية",
      "بيل",
      "قطار كارديف",
      "bale",
      "gareth"
    ],
    "nationality": "ويلز",
    "nationalityCode": "GB",
    "clubs": [
      "ساوثهامبتون",
      "توتنهام",
      "ريال مدريد",
      "توتنهام",
      "لوس أنجلوس إف سي"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "سرعة_رهيبة",
      "أهداف_نهائيات_تاريخية",
      "ضربات_مقصية"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_marcelo_vieira",
    "name": "مارسيلو فييرا",
    "aliases": [
      "مارسيلو",
      "الساحر البرازيلي",
      "marcelo"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فلومينينسي",
      "ريال مدريد",
      "أولمبياكوس",
      "فلومينينسي"
    ],
    "currentClub": "حر",
    "position": "DEF",
    "traits": [
      "أكثر_من_حقق_ألقاب_مع_الريال",
      "مهاري_جداً",
      "ظهير_هجومي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كوبا ليبرتادوريس"
    ]
  },
  {
    "id": "p_gerard_pique",
    "name": "جيرارد بيكيه",
    "aliases": [
      "بيكيه",
      "الرئيس",
      "pique",
      "gerard"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "مانشستر يونايتد",
      "ريال سرقسطة",
      "برشلونة"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "بطل_العالم",
      "مدافع_أنيق",
      "ثلاثيات"
    ],
    "trophies": [
      "كأس العالم",
      "كأس أمم أوروبا",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الإنجليزي"
    ]
  },
  {
    "id": "p_casemiro",
    "name": "كارلوس كاسيميرو",
    "aliases": [
      "كاسيميرو",
      "الدبابة",
      "casemiro"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "ساو باولو",
      "ريال مدريد",
      "بورتو",
      "ريال مدريد",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "MID",
    "traits": [
      "صلب_جداً",
      "قاطع_كرات",
      "5_أبطال_أوروبا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_marcus_rashford",
    "name": "ماركوس راشفورد",
    "aliases": [
      "راشفورد",
      "rashford",
      "marcus"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "FWD",
    "traits": [
      "سريع",
      "تسديد_قوي"
    ],
    "trophies": [
      "الدوري الأوروبي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_lisandro_martinez",
    "name": "ليساندرو مارتينيز",
    "aliases": [
      "الجزار",
      "مارتينيز",
      "lisandro martinez",
      "the butcher"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "نيولز أولد بويز",
      "ديفنسا خوستيكا",
      "أياكس",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "DEF",
    "traits": [
      "شراسة_دفاعية",
      "بطل_العالم",
      "بناء_لعب"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا",
      "الدوري الهولندي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_alejandro_garnacho",
    "name": "أليخاندرو غارناتشو",
    "aliases": [
      "غارناتشو",
      "مقصية_غارناتشو",
      "garnacho"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "أتلتيكو مدريد_شباب",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "FWD",
    "traits": [
      "سريع_ومراوغ",
      "بطل_كوبا_أمريكا"
    ],
    "trophies": [
      "كوبا أمريكا",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_kobbie_mainoo",
    "name": "كوبي ماينو",
    "aliases": [
      "ماينو",
      "mainoo",
      "kobbie"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "MID",
    "traits": [
      "موهبة_شابة",
      "هدوء_خارق_بالكرة"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_andre_onana",
    "name": "أندريه أونانا",
    "aliases": [
      "أونانا",
      "onana",
      "andre"
    ],
    "nationality": "الكاميرون",
    "nationalityCode": "CM",
    "clubs": [
      "برشلونة_شباب",
      "أياكس",
      "إنتر ميلان",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "GK",
    "traits": [
      "لعب_ممتاز_بالقدمين",
      "ردات_فعل"
    ],
    "trophies": [
      "الدوري الهولندي",
      "كأس إيطاليا",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_kai_havertz",
    "name": "كاي هافيرتز",
    "aliases": [
      "هافيرتز",
      "رجل_نهائي_الأبطال",
      "havertz",
      "kai"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "باير ليفركوزن",
      "تشيلسي",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "FWD",
    "traits": [
      "سجل_هدف_نهائي_الأبطال_2021",
      "ذكي_بالتحرك"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_gabriel_martinelli",
    "name": "غابرييل مارتينيلي",
    "aliases": [
      "مارتينيلي",
      "martinelli",
      "gabriel"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "إيتوانو",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "FWD",
    "traits": [
      "سرعة_رهيبة",
      "ضغط_شديد",
      "ذهبية_الأولمبياد"
    ],
    "trophies": [
      "ذهبية_الأولمبياد",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_david_raya",
    "name": "دافيد رايا",
    "aliases": [
      "رايا",
      "raya",
      "david"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "بلاكبيرن",
      "ساوثبورت",
      "برينتفورد",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "GK",
    "traits": [
      "قفاز_ذهبي_إنجليزي",
      "بطل_أوروبا"
    ],
    "trophies": [
      "كأس أمم أوروبا"
    ]
  },
  {
    "id": "p_gabriel_magalhaes",
    "name": "غابرييل ماغاليس",
    "aliases": [
      "ماغاليس",
      "gabriel magalhaes"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "أفاي",
      "ليل",
      "تروا",
      "دينامو زغرب",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "DEF",
    "traits": [
      "صلب_جداً",
      "أهداف_رأسية"
    ],
    "trophies": []
  },
  {
    "id": "p_cristian_romero",
    "name": "كريستيان روميرو",
    "aliases": [
      "كوتي",
      "روميرو",
      "cuti romero"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "بلغرانو",
      "جنوى",
      "يوفنتوس",
      "أتالانتا",
      "توتنهام"
    ],
    "currentClub": "توتنهام",
    "position": "DEF",
    "traits": [
      "بطل_العالم",
      "شراسة_دفاعية",
      "بطل_كوبا_أمريكا"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_james_maddison",
    "name": "جيمس ماديسون",
    "aliases": [
      "ماديسون",
      "maddison",
      "james"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "كوفنتري سيتي",
      "نورويتش سيتي",
      "أبردين",
      "ليستر سيتي",
      "توتنهام"
    ],
    "currentClub": "توتنهام",
    "position": "MID",
    "traits": [
      "ركلات_حرة_متقنة",
      "صانع_فرص"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_dejan_kulusevski",
    "name": "ديان كولوسيفسكي",
    "aliases": [
      "كولوسيفسكي",
      "kulu",
      "kulusevski"
    ],
    "nationality": "السويد",
    "nationalityCode": "SE",
    "clubs": [
      "أتالانتا",
      "بارما",
      "يوفنتوس",
      "توتنهام"
    ],
    "currentClub": "توتنهام",
    "position": "MID",
    "traits": [
      "قوي_بدنياً",
      "قدم_يسرى",
      "صناعة_فرص"
    ],
    "trophies": [
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_moises_caicedo",
    "name": "مويسيس كايسيدو",
    "aliases": [
      "كايسيدو",
      "caicedo",
      "moises"
    ],
    "nationality": "الإكوادور",
    "nationalityCode": "EC",
    "clubs": [
      "إنديبندينتي ديل فال",
      "بيرشوت",
      "برايتون",
      "تشيلسي"
    ],
    "currentClub": "تشيلسي",
    "position": "MID",
    "traits": [
      "أغلى_لاعب_في_البريميرليغ",
      "قاطع_كرات_خارق"
    ],
    "trophies": [
      "كوبا سودأمريكانا"
    ]
  },
  {
    "id": "p_nicolas_jackson",
    "name": "نيكولاس جاكسون",
    "aliases": [
      "جاكسون",
      "jackson",
      "nicolas"
    ],
    "nationality": "السنغال",
    "nationalityCode": "SN",
    "clubs": [
      "كاسا سبورتس",
      "ميرانديس",
      "فياريال",
      "تشيلسي"
    ],
    "currentClub": "تشيلسي",
    "position": "FWD",
    "traits": [
      "سريع",
      "ربط_لعب"
    ],
    "trophies": []
  },
  {
    "id": "p_christopher_nkunku",
    "name": "كريستوفر نكونكو",
    "aliases": [
      "نكونكو",
      "nkunku",
      "christopher"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "باريس سان جيرمان",
      "لايبزيغ",
      "تشيلسي"
    ],
    "currentClub": "تشيلسي",
    "position": "FWD",
    "traits": [
      "مهاري_سريع",
      "إنهاء_دقيق"
    ],
    "trophies": [
      "الدوري الفرنسي",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_reece_james",
    "name": "رييس جيمس",
    "aliases": [
      "جيمس",
      "كابتن تشيلسي",
      "reece james"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "ويغان أثلتيك",
      "تشيلسي"
    ],
    "currentClub": "تشيلسي",
    "position": "DEF",
    "traits": [
      "قائد_تشيلسي",
      "قوة_بدنية_وعرضيات",
      "بطل_أوروبا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "كأس السوبر الأوروبي"
    ]
  },
  {
    "id": "p_kieran_trippier",
    "name": "كيران تريبيير",
    "aliases": [
      "تريبيير",
      "trippier",
      "kieran"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "بارنسلي",
      "بيرنلي",
      "توتنهام",
      "أتلتيكو مدريد",
      "نيوكاسل"
    ],
    "currentClub": "نيوكاسل",
    "position": "DEF",
    "traits": [
      "متخصص_ركلات_ثابتة",
      "بطل_إسبانيا"
    ],
    "trophies": [
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_lucas_paqueta",
    "name": "لوكاس باكيتا",
    "aliases": [
      "باكيتا",
      "paqueta",
      "lucas"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فلامنغو",
      "ميلان",
      "ليون",
      "وست هام"
    ],
    "currentClub": "وست هام",
    "position": "MID",
    "traits": [
      "مهارات_سامبا",
      "بطل_دوري_المؤتمر"
    ],
    "trophies": [
      "دوري المؤتمر الأوروبي",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_jarrod_bowen",
    "name": "جارود بوين",
    "aliases": [
      "بوين",
      "bowen",
      "jarrod"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB",
    "clubs": [
      "هيرفورد يونايتد",
      "هال سيتي",
      "وست هام"
    ],
    "currentClub": "وست هام",
    "position": "FWD",
    "traits": [
      "سجل_هدف_البطولة_لوست_هام",
      "مقاتل"
    ],
    "trophies": [
      "دوري المؤتمر الأوروبي"
    ]
  },
  {
    "id": "p_raphinha_belloli",
    "name": "رافينيا دياز",
    "aliases": [
      "رافينيا",
      "raphinha"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "أفاي",
      "فيتوريا غيماريش",
      "سبورتينغ لشبونة",
      "رين",
      "ليدز يونايتد",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "FWD",
    "traits": [
      "شعلة_نشاط",
      "هاتريك_بالأبطال",
      "قدم_يسرى"
    ],
    "trophies": [
      "الدوري الإسباني",
      "كأس البرتغال"
    ]
  },
  {
    "id": "p_frenkie_de_jong",
    "name": "فرينكي دي يونغ",
    "aliases": [
      "دي يونغ",
      "frenkie",
      "de jong"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "فيليم 2",
      "أياكس",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "MID",
    "traits": [
      "خروج_بالكرة_من_الضغط",
      "رشيق"
    ],
    "trophies": [
      "الدوري الهولندي",
      "الدوري الإسباني",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_dani_olmo",
    "name": "داني أولمو",
    "aliases": [
      "أولمو",
      "dani olmo"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "دينامو زغرب",
      "لايبزيغ",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "MID",
    "traits": [
      "هداف_اليورو",
      "بطل_أوروبا",
      "ذكي_بين_الخطوط"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "دوري الأمم الأوروبية",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_jules_kounde",
    "name": "جول كوندي",
    "aliases": [
      "كوندي",
      "أيقونة الموضة",
      "kounde",
      "jules"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "بوردو",
      "إشبيلية",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "DEF",
    "traits": [
      "مدافع_وظهير_عصري",
      "دوري_الأمم_الأوروبية"
    ],
    "trophies": [
      "الدوري الإسباني",
      "الدوري الأوروبي",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_ronald_araujo",
    "name": "رونالد أراوخو",
    "aliases": [
      "أراوخو",
      "الدبابة الأوروغويانية",
      "araujo",
      "ronald"
    ],
    "nationality": "الأوروغواي",
    "nationalityCode": "UY",
    "clubs": [
      "رينتيستاس",
      "بوسطن ريفر",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "DEF",
    "traits": [
      "سرعة_وقوة_بدنية_جبارة",
      "مقاتل"
    ],
    "trophies": [
      "الدوري الإسباني",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_pau_cubarsi",
    "name": "باو كوبارسي",
    "aliases": [
      "كوبارسي",
      "cubarsi",
      "pau"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "DEF",
    "traits": [
      "توزيع_كرات_مذهل_في_سن_صغير",
      "ذهبية_الأولمبياد"
    ],
    "trophies": [
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_arda_guler",
    "name": "أردا غولر",
    "aliases": [
      "غولر",
      "الموهبة التركية",
      "guler",
      "arda"
    ],
    "nationality": "تركيا",
    "nationalityCode": "TR",
    "clubs": [
      "فنربخشة",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "MID",
    "traits": [
      "قدم_يسرى_ساحرة",
      "أهداف_جميلة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كأس تركيا"
    ]
  },
  {
    "id": "p_endrick_felipe",
    "name": "إندريك فيليبي",
    "aliases": [
      "إندريك",
      "بوبي الصغير",
      "endrick"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "بالميراس",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "FWD",
    "traits": [
      "تسديد_يساري_ساحق",
      "موهبة_برازيلية_صاعدة"
    ],
    "trophies": [
      "الدوري البرازيلي",
      "كأس السوبر الأوروبي"
    ]
  },
  {
    "id": "p_eder_militao",
    "name": "إيدير ميليتاو",
    "aliases": [
      "ميليتاو",
      "militao",
      "eder"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "ساو باولو",
      "بورتو",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "DEF",
    "traits": [
      "سريع_وقوي",
      "ارتقاء_عالي"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_david_alaba",
    "name": "دافيد ألابا",
    "aliases": [
      "ألابا",
      "alaba",
      "david"
    ],
    "nationality": "النمسا",
    "nationalityCode": "AT",
    "clubs": [
      "أوستريا فيينا",
      "هوفنهايم",
      "بايرن ميونخ",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "DEF",
    "traits": [
      "جوكر_دفاعي",
      "ضربات_حرة",
      "ألقاب_لا_تعد"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_rodrigo_de_paul",
    "name": "رودريغو دي بول",
    "aliases": [
      "دي بول",
      "حارس ميسي الشخصي",
      "de paul",
      "rodrigo"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "راسينغ كلوب",
      "فالنسيا",
      "راسينغ كلوب",
      "أودينيزي",
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "MID",
    "traits": [
      "بطل_العالم",
      "روح_قتالية_عالية",
      "صديق_ميسي"
    ],
    "trophies": [
      "كأس العالم",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_alexander_sorloth",
    "name": "ألكسندر سورلوث",
    "aliases": [
      "سورلوث",
      "العملاق النرويجي",
      "sorloth"
    ],
    "nationality": "النرويج",
    "nationalityCode": "NO",
    "clubs": [
      "روزنبورغ",
      "غرونينغن",
      "ميتييلاند",
      "كريستال بالاس",
      "غنت",
      "طرابزون سبور",
      "لايبزيغ",
      "ريال سوسيداد",
      "فياريال",
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "FWD",
    "traits": [
      "سوبر_هاتريك_ضد_الريال",
      "طويل_وهداف"
    ],
    "trophies": [
      "كأس تركيا"
    ]
  },
  {
    "id": "p_yann_sommer",
    "name": "يان سومر",
    "aliases": [
      "سومر",
      "sommer",
      "yann"
    ],
    "nationality": "سويسرا",
    "nationalityCode": "CH",
    "clubs": [
      "بازل",
      "فادوتس",
      "غراسهوبر",
      "بوروسيا مونشنغلادباخ",
      "بايرن ميونخ",
      "إنتر ميلان"
    ],
    "currentClub": "إنتر ميلان",
    "position": "GK",
    "traits": [
      "صد_بلنتيات_تاريخي_أمام_فرنسا",
      "بطل_إيطاليا"
    ],
    "trophies": [
      "الدوري الألماني",
      "الدوري الإيطالي",
      "الدوري السويسري"
    ]
  },
  {
    "id": "p_teun_koopmeiners",
    "name": "تون كوبماينرز",
    "aliases": [
      "كوبماينرز",
      "koopmeiners",
      "teun"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "ألكمار",
      "أتالانتا",
      "يوفنتوس"
    ],
    "currentClub": "يوفنتوس",
    "position": "MID",
    "traits": [
      "تسديد_صاروخي",
      "بطل_الدوري_الأوروبي"
    ],
    "trophies": [
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_gleison_bremer",
    "name": "غليسون بريمر",
    "aliases": [
      "بريمر",
      "bremer"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "أتلتيكو مينيرو",
      "تورينو",
      "يوفنتوس"
    ],
    "currentClub": "يوفنتوس",
    "position": "DEF",
    "traits": [
      "صخرة_الدفاع_الإيطالي",
      "قوة_بدنية"
    ],
    "trophies": [
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_kenan_yildiz",
    "name": "كينان يلدز",
    "aliases": [
      "يلدز",
      "ديل بييرو الجديد",
      "yildiz",
      "kenan"
    ],
    "nationality": "تركيا",
    "nationalityCode": "TR",
    "clubs": [
      "بايرن ميونخ_شباب",
      "يوفنتوس"
    ],
    "currentClub": "يوفنتوس",
    "position": "FWD",
    "traits": [
      "رقم_10_اليوفي",
      "مهاري_جداً",
      "أهداف_خيالية"
    ],
    "trophies": [
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_douglas_luiz",
    "name": "دوغلاس لويز",
    "aliases": [
      "لويز",
      "douglas luiz"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فاسكو دا غاما",
      "جيرونا",
      "أستون فيلا",
      "يوفنتوس"
    ],
    "currentClub": "يوفنتوس",
    "position": "MID",
    "traits": [
      "أهداف_من_ضربات_ركنية",
      "تسديد"
    ],
    "trophies": [
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_memphis_depay",
    "name": "ممفيس ديباي",
    "aliases": [
      "ديباي",
      "ممفيس",
      "depay",
      "memphis"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أيندهوفن",
      "مانشستر يونايتد",
      "ليون",
      "برشلونة",
      "أتلتيكو مدريد",
      "كورينثيانز"
    ],
    "currentClub": "كورينثيانز",
    "position": "FWD",
    "traits": [
      "هداف_هولندا_التاريخي_تقريباً",
      "مهاري"
    ],
    "trophies": [
      "الدوري الإسباني",
      "الدوري الهولندي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_marco_verratti",
    "name": "ماركو فيراتي",
    "aliases": [
      "البومة",
      "فيراتي",
      "verratti",
      "marco"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "بيسكارا",
      "باريس سان جيرمان",
      "العربي القطري"
    ],
    "currentClub": "العربي القطري",
    "position": "MID",
    "traits": [
      "خروج_خارق_بالكرة_من_المرمى",
      "بطل_أوروبا"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "الدوري الفرنسي"
    ]
  },
  {
    "id": "p_hugo_lloris",
    "name": "هوغو لوريس",
    "aliases": [
      "لوريس",
      "كابتن فرنسا",
      "lloris",
      "hugo"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "نيس",
      "ليون",
      "توتنهام",
      "لوس أنجلوس إف سي"
    ],
    "currentClub": "لوس أنجلوس إف سي",
    "position": "GK",
    "traits": [
      "قائد_بطل_العالم_2018",
      "ردات_فعل"
    ],
    "trophies": [
      "كأس العالم",
      "دوري الأمم الأوروبية",
      "كأس فرنسا"
    ]
  },
  {
    "id": "p_sergio_aguero",
    "name": "سيرخيو أغويرو",
    "aliases": [
      "كون أغويرو",
      "الكون",
      "هدف_93:20",
      "aguero",
      "kun"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "إنديبندينتي",
      "أتلتيكو مدريد",
      "مانشستر سيتي",
      "برشلونة"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هداف_السيتي_التاريخي",
      "هدف_الدوري_الشهير"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "كوبا أمريكا",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_carlos_tevez",
    "name": "كارلوس تيفيز",
    "aliases": [
      "الأباتشي",
      "تيفيز",
      "tevez",
      "el apache"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "بوكا جونيورز",
      "كورينثيانز",
      "وست هام",
      "مانشستر يونايتد",
      "مانشستر سيتي",
      "يوفنتوس",
      "شنغهاي شينهوا",
      "بوكا جونيورز"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "مقاتل_شوارع_لا_يهدأ",
      "بطل_إنجلترا_وإيطاليا"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "الدوري الإيطالي",
      "كوبا ليبرتادوريس",
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_javier_mascherano",
    "name": "خافيير ماسكيرانو",
    "aliases": [
      "الخيفيتو",
      "ماسكيرانو",
      "رئيس_الأركان",
      "mascherano"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "ريفر بليت",
      "كورينثيانز",
      "وست هام",
      "ليفربول",
      "برشلونة",
      "هيبي فورتشن",
      "إستوديانتيس"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "تدخل_روبن_الشهير_2014",
      "مقاتل_مطلق"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_diego_godin",
    "name": "دييغو غودين",
    "aliases": [
      "غودين",
      "زعيم أتلتيكو",
      "godin",
      "diego"
    ],
    "nationality": "الأوروغواي",
    "nationalityCode": "UY",
    "clubs": [
      "سيرو",
      "ناسيونال",
      "فياريال",
      "أتلتيكو مدريد",
      "إنتر ميلان",
      "كالياري",
      "أتلتيكو مينيرو",
      "فيليز سارسفيلد"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "قائد_الأتليتي_التاريخي",
      "رأسيات_حاسمة"
    ],
    "trophies": [
      "الدوري الإسباني",
      "الدوري الأوروبي",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_radamel_falcao",
    "name": "راداميل فالكاو",
    "aliases": [
      "النمر",
      "فالكاو",
      "falcao",
      "el tigre"
    ],
    "nationality": "كولومبيا",
    "nationalityCode": "CO",
    "clubs": [
      "ريفر بليت",
      "بورتو",
      "أتلتيكو مدريد",
      "موناكو",
      "مانشستر يونايتد",
      "تشيلسي",
      "غلطة سراي",
      "رايو فايكانو",
      "ميلوناريوس"
    ],
    "currentClub": "ميلوناريوس",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "ملك_الدوري_الأوروبي",
      "هاتريك_تشيلسي"
    ],
    "trophies": [
      "الدوري الأوروبي",
      "الدوري الفرنسي",
      "الدوري الإسباني",
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_saud_kariri",
    "name": "سعود كريري",
    "aliases": [
      "كريري",
      "أبو علي",
      "saud kariri"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "القادسية",
      "الاتحاد",
      "الهلال",
      "الشباب"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "قائد",
      "محور_دفاعي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_osama_hawsawi",
    "name": "أسامة هوساوي",
    "aliases": [
      "أبو كلبشة",
      "هوساوي",
      "osama hawsawi"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الوحدة",
      "الهلال",
      "أندرلخت",
      "الأهلي",
      "الهلال",
      "الوحدة"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "قائد",
      "قلب_دفاع",
      "محترف_سابق",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس ولي العهد",
      "كأس السوبر البلجيكي"
    ]
  },
  {
    "id": "p_taiseer_aljassam",
    "name": "تيسير الجاسم",
    "aliases": [
      "الجاسم",
      "تيسير",
      "taiseer al-jassam"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "هجر",
      "الأهلي",
      "الغرافة",
      "قطر",
      "الوحدة",
      "الكويت"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "قائد",
      "صانع_ألعاب",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الملك",
      "كأس ولي العهد"
    ]
  },
  {
    "id": "p_hamad_almontashari",
    "name": "حمد المنتشري",
    "aliases": [
      "المنتشري",
      "أفضل لاعب في آسيا 2005",
      "hamad al-montashari"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتحاد"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "أسطورة",
      "أفضل_لاعب_في_آسيا",
      "قلب_دفاع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس العرب"
    ]
  },
  {
    "id": "p_abdullah_alzoori",
    "name": "عبد الله الزوري",
    "aliases": [
      "الزوري",
      "abdullah al-zori"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "النهضة",
      "الهلال",
      "الوحدة",
      "الشباب",
      "أبها"
    ],
    "currentClub": "معتزل",
    "position": "DEF",
    "traits": [
      "ظهير_أيسر",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس ولي العهد",
      "كأس الملك"
    ]
  },
  {
    "id": "p_marwan_alsahafi",
    "name": "مروان الصحفي",
    "aliases": [
      "الصحفي",
      "marwan al-sahafi"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتحاد",
      "بيرشكوت"
    ],
    "currentClub": "بيرشكوت",
    "position": "FWD",
    "traits": [
      "سريع",
      "محترف_في_بلجيكا",
      "موهبة_شابة"
    ],
    "trophies": [
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_faisal_alghamdi",
    "name": "فيصل الغامدي",
    "aliases": [
      "الغامدي",
      "faisal al-ghamdi"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتفاق",
      "الاتحاد",
      "بيرشكوت"
    ],
    "currentClub": "بيرشكوت",
    "position": "MID",
    "traits": [
      "محور_شاب",
      "محترف_في_بلجيكا"
    ],
    "trophies": []
  },
  {
    "id": "p_musab_aljuwayr",
    "name": "مصعب الجوير",
    "aliases": [
      "الجوير",
      "musab al-juwayr"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال",
      "الشباب"
    ],
    "currentClub": "الشباب",
    "position": "MID",
    "traits": [
      "صانع_ألعاب_شاب",
      "تسديدات_دقيقة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_abdullah_radif",
    "name": "عبد الله رديف",
    "aliases": [
      "رديف",
      "abdullah radif"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الهلال",
      "التعاون",
      "الشباب",
      "الاتفاق"
    ],
    "currentClub": "الاتفاق",
    "position": "FWD",
    "traits": [
      "مهاجم_شاب",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_abdulelah_almalki",
    "name": "عبد الإله المالكي",
    "aliases": [
      "المالكي",
      "abdulelah al-malki"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الوحدة",
      "الاتحاد",
      "الهلال",
      "الاتفاق"
    ],
    "currentClub": "الاتفاق",
    "position": "MID",
    "traits": [
      "محور_قتالي",
      "مونديال_2022",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الملك"
    ]
  },
  {
    "id": "p_talal_haji",
    "name": "طلال حاجي",
    "aliases": [
      "حاجي",
      "أصغر لاعب في آسيا",
      "talal haji"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الاتحاد",
      "الرياض"
    ],
    "currentClub": "الرياض",
    "position": "FWD",
    "traits": [
      "موهبة_واعدة",
      "أصغر_لاعب",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_abbas_alhasan",
    "name": "عباس الحسن",
    "aliases": [
      "عباس",
      "الحسن",
      "abbas al-hassan"
    ],
    "nationality": "السعودية",
    "nationalityCode": "SA",
    "clubs": [
      "الفتح",
      "نيوم"
    ],
    "currentClub": "نيوم",
    "position": "MID",
    "traits": [
      "محور_شاب",
      "لعب_بالسعودية"
    ],
    "trophies": []
  },
  {
    "id": "p_andre_carrillo",
    "name": "أندريه كاريو",
    "aliases": [
      "الحية",
      "كاريو",
      "carrillo",
      "andre"
    ],
    "nationality": "بيرو",
    "nationalityCode": "PE",
    "clubs": [
      "أليانزا ليما",
      "سبورتينغ لشبونة",
      "بنفيكا",
      "واتفورد",
      "الهلال",
      "القادسية",
      "كورينثيانز"
    ],
    "currentClub": "كورينثيانز",
    "position": "FWD",
    "traits": [
      "جناح_مهاري",
      "سريع",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_romarinho",
    "name": "رومارينيو",
    "aliases": [
      "روما",
      "رومارينهو",
      "romarinho"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "كورينثيانز",
      "الجيش",
      "الجزيرة",
      "الاتحاد",
      "نيوم"
    ],
    "currentClub": "نيوم",
    "position": "FWD",
    "traits": [
      "هداف_الاتحاد_التاريخي_حديثاً",
      "حاسم",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كوبا ليبرتادوريس",
      "كأس العالم للأندية",
      "الدوري السعودي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_igor_coronado",
    "name": "إيغور كورونادو",
    "aliases": [
      "كورونادو",
      "الساحر",
      "coronado",
      "igor"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فلوريانا",
      "تراباني",
      "باليرمو",
      "الشارقة",
      "الاتحاد",
      "كورينثيانز"
    ],
    "currentClub": "كورينثيانز",
    "position": "MID",
    "traits": [
      "تمريرات_سحرية",
      "كرات_ثابتة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "الدوري الإماراتي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_marcelo_grohe",
    "name": "مارسيلو غروهي",
    "aliases": [
      "غروهي",
      "جدار برلين",
      "grohe",
      "marcelo"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "غريميو",
      "الاتحاد",
      "الخلود"
    ],
    "currentClub": "الخلود",
    "position": "GK",
    "traits": [
      "تصديات_إعجازية",
      "أفضل_حارس_بالدوري",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كوبا ليبرتادوريس",
      "الدوري السعودي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_nordin_amrabat",
    "name": "نور الدين أمرابط",
    "aliases": [
      "المحارب",
      "أمرابط الكبير",
      "nordin amrabat"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "أيندهوفن",
      "قيصري سبور",
      "غلطة سراي",
      "ملقا",
      "واتفورد",
      "النصر",
      "أيك أثينا"
    ],
    "currentClub": "أيك أثينا",
    "position": "FWD",
    "traits": [
      "قوة_بدنية_هائلة",
      "مقاتل",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "الدوري التركي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_petros_matheus",
    "name": "بيتروس ماثيوس",
    "aliases": [
      "بيتروس",
      "الزعيم الصغير",
      "petros"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "كورينثيانز",
      "ريال بيتيس",
      "ساو باولو",
      "النصر",
      "الفتح",
      "نيوم"
    ],
    "currentClub": "نيوم",
    "position": "MID",
    "traits": [
      "استفزاز_الخصوم",
      "محور_مقاتل",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_giuliano_victor",
    "name": "جوليانو فيكتور",
    "aliases": [
      "جوليانو",
      "giuliano"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "إنترناسيونال",
      "دنيبرو",
      "غريميو",
      "زينيت",
      "فنربخشة",
      "النصر",
      "إسطنبول باشاك شهير",
      "كورينثيانز",
      "سانتوس"
    ],
    "currentClub": "سانتوس",
    "position": "MID",
    "traits": [
      "صانع_ألعاب_كلاسيكي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كوبا ليبرتادوريس",
      "الدوري السعودي",
      "كأس السوبر السعودي"
    ]
  },
  {
    "id": "p_elton_jose",
    "name": "إلتون خوزيه",
    "aliases": [
      "إلتون",
      "القصير المكير",
      "elton jose"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "كورينثيانز",
      "ستيوا بوخارست",
      "النصر",
      "دبي",
      "الوصل",
      "الفتح",
      "مسيمير",
      "القادسية",
      "الوحدة"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أقصر_لاعب",
      "تسديدات_خارقة",
      "بطل_دوري_الفتح_التاريخي",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس السوبر السعودي",
      "الدوري البرازيلي"
    ]
  },
  {
    "id": "p_mourad_batna",
    "name": "مراد باتنا",
    "aliases": [
      "باتنا",
      "القدم اليسرى الساحرة",
      "mourad batna"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "حسنية أگادير",
      "الفتح الرباطي",
      "الإمارات",
      "الوحدة الإماراتي",
      "الجزيرة",
      "الفتح"
    ],
    "currentClub": "الفتح",
    "position": "FWD",
    "traits": [
      "أهداف_من_ضربات_حرة",
      "جناح_مهاري",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري المغربي",
      "كأس رئيس دولة الإمارات"
    ]
  },
  {
    "id": "p_victor_simoes",
    "name": "فيكتور سيموس",
    "aliases": [
      "السفاح",
      "سيموس",
      "victor simoes"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فلامنغو",
      "بيرشكوت",
      "كلوب بروج",
      "تشونغتشينغ",
      "بوتافوغو",
      "الأهلي",
      "أم صلال"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "سفاح_الشباك",
      "قوة_بدنية_مرعبة",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس خادم الحرمين الشريفين"
    ]
  },
  {
    "id": "p_emad_alhosani",
    "name": "عماد الحوسني",
    "aliases": [
      "العمدة",
      "الحوسني",
      "emad al-hosani"
    ],
    "nationality": "عمان",
    "nationalityCode": "OM",
    "clubs": [
      "الخابورة",
      "الرياض",
      "قطر",
      "ريان",
      "شارلوروا",
      "الأهلي",
      "النصر",
      "صحم",
      "فنجاء"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أهداف_دبل_كيك_شهيرة",
      "هداف_عماني_أسطوري",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "كأس الخليج",
      "كأس الملك",
      "الدوري السعودي"
    ]
  },
  {
    "id": "p_tcheco",
    "name": "تشيكو",
    "aliases": [
      "الموسيقار",
      "tcheco"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "بارانا",
      "مالاتيا سبور",
      "الاتحاد",
      "غريميو",
      "كورينثيانز"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "موسيقار_آسيا",
      "بطل_آسيا_مرتين",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "كأس العرب"
    ]
  },
  {
    "id": "p_marcelo_camacho",
    "name": "مارسيلو كاماتشو",
    "aliases": [
      "كاماتشو",
      "مدفعجي",
      "camacho"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "بانغو",
      "الهلال",
      "العربي",
      "الشباب",
      "الأهلي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "متخصص_كرات_ثابتة",
      "لعب_للأهلي_والهلال_والشباب",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس الملك",
      "كأس ولي العهد"
    ]
  },
  {
    "id": "p_thiago_neves",
    "name": "تياغو نيفيز",
    "aliases": [
      "نيفيز",
      "أبو ركبة",
      "thiago neves"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "بارانا",
      "فلومينينسي",
      "هامبورغ",
      "الهلال",
      "فلامنغو",
      "الجزيرة",
      "كروزيرو",
      "غريميو",
      "سبورت ريسيفي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "تسديدات_خرافية",
      "هاتريك_الاتحاد_الشهير",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "الدوري السعودي",
      "كأس البرازيل",
      "كأس ولي العهد"
    ]
  },
  {
    "id": "p_sandro_tonali",
    "name": "ساندرو تونالي",
    "aliases": [
      "تونالي",
      "بيرلو الجديد",
      "tonali",
      "sandro"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "بريشيا",
      "ميلان",
      "نيوكاسل"
    ],
    "currentClub": "نيوكاسل",
    "position": "MID",
    "traits": [
      "محور_إيطالي_شامل",
      "تمريرات_طويلة"
    ],
    "trophies": [
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_dominik_szoboszlai",
    "name": "دومينيك سوبوسلاي",
    "aliases": [
      "سوبوسلاي",
      "قاذفة الصواريخ",
      "szoboszlai",
      "dominik"
    ],
    "nationality": "المجر",
    "nationalityCode": "HU",
    "clubs": [
      "ليفيرينغ",
      "سالزبورغ",
      "لايبزيغ",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "MID",
    "traits": [
      "قائد_المجر",
      "تسديدات_مدفعية",
      "جري_لا_ينتهي"
    ],
    "trophies": [
      "كأس ألمانيا",
      "كأس الرابطة الإنجليزية",
      "الدوري النمساوي"
    ]
  },
  {
    "id": "p_cody_gakpo",
    "name": "كودي جاكبو",
    "aliases": [
      "جاكبو",
      "gakpo",
      "cody"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أيندهوفن",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "FWD",
    "traits": [
      "هداف_هولندا_في_المونديال",
      "متعدد_المراكز"
    ],
    "trophies": [
      "كأس هولندا",
      "كأس الرابطة الإنجليزية"
    ]
  },
  {
    "id": "p_luis_diaz",
    "name": "لويس دياز",
    "aliases": [
      "لوتشو",
      "دياز",
      "luis diaz",
      "lucho"
    ],
    "nationality": "كولومبيا",
    "nationalityCode": "CO",
    "clubs": [
      "بارانكيا",
      "جونيو دي بارانكيا",
      "بورتو",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "FWD",
    "traits": [
      "مراوغ_ساحر",
      "مرونة_وسرعة"
    ],
    "trophies": [
      "الدوري البرتغالي",
      "كأس الاتحاد الإنجليزي",
      "كأس الرابطة الإنجليزية"
    ]
  },
  {
    "id": "p_darwin_nunez",
    "name": "داروين نونيز",
    "aliases": [
      "نونيز",
      "الطوربيد الأوروغوياني",
      "darwin nunez"
    ],
    "nationality": "الأوروغواي",
    "nationalityCode": "UY",
    "clubs": [
      "بينارول",
      "ألميريا",
      "بنفيكا",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "FWD",
    "traits": [
      "سرعة_فائقة",
      "قوة_بدنية",
      "شغف_كبير"
    ],
    "trophies": [
      "كأس الرابطة الإنجليزية"
    ]
  },
  {
    "id": "p_rasmus_hojlund",
    "name": "راسموس هويلوند",
    "aliases": [
      "هويلوند",
      "hojlund",
      "rasmus"
    ],
    "nationality": "الدنمارك",
    "nationalityCode": "DK",
    "clubs": [
      "كوبنهاغن",
      "شتورم غراتس",
      "أتالانتا",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "FWD",
    "traits": [
      "مهاجم_دنماركي_شاب",
      "قوة_وسرعة"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي",
      "كأس النمسا"
    ]
  },
  {
    "id": "p_josko_gvardiol",
    "name": "يوشكو غفارديول",
    "aliases": [
      "غفارديول",
      "المقنع",
      "gvardiol",
      "josko"
    ],
    "nationality": "كرواتيا",
    "nationalityCode": "HR",
    "clubs": [
      "دينامو زغرب",
      "لايبزيغ",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "DEF",
    "traits": [
      "مدافع_عصري",
      "تسديدات_بالقدم_الضعيفة",
      "برونزية_المونديال"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "كأس السوبر الأوروبي",
      "كأس العالم للأندية",
      "كأس ألمانيا"
    ]
  },
  {
    "id": "p_jeremy_doku",
    "name": "جيريمي دوكو",
    "aliases": [
      "دوكو",
      "المراوغ البلجيكي",
      "doku",
      "jeremy"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "أندرلخت",
      "رين",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "FWD",
    "traits": [
      "مراوغ_مرعب_واحد_ضد_واحد",
      "تسارع_مذهل"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_savinho",
    "name": "سافينيو",
    "aliases": [
      "سافيو",
      "savinho",
      "savio"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "أتلتيكو مينيرو",
      "تروا",
      "آيندهوفن",
      "جيرونا",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "FWD",
    "traits": [
      "جناح_برازيلي_مهاري",
      "صانع_فرص"
    ],
    "trophies": [
      "درع المجتمع"
    ]
  },
  {
    "id": "p_pedro_porro",
    "name": "بيدرو بورو",
    "aliases": [
      "بورو",
      "porro",
      "pedro"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "جيرونا",
      "بلد الوليد",
      "سبورتينغ لشبونة",
      "توتنهام"
    ],
    "currentClub": "توتنهام",
    "position": "DEF",
    "traits": [
      "ظهير_هجومي",
      "تسديدات_قوية"
    ],
    "trophies": [
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_micky_van_de_ven",
    "name": "ميكي فان دي فين",
    "aliases": [
      "فان دي فين",
      "أسرع مدافع",
      "van de ven",
      "micky"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "فولندام",
      "فولفسبورغ",
      "توتنهام"
    ],
    "currentClub": "توتنهام",
    "position": "DEF",
    "traits": [
      "أسرع_لاعب_في_البريميرليغ",
      "تدخلات_إنقاذية"
    ],
    "trophies": []
  },
  {
    "id": "p_fermin_lopez",
    "name": "فيرمين لوبيز",
    "aliases": [
      "فيرمين",
      "fermin lopez",
      "fermin"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ليناريس",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "MID",
    "traits": [
      "هداف_أولمبياد_باريس",
      "تسديدات_قوية_من_خارج_المنطقة"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "ذهبية_الأولمبياد"
    ]
  },
  {
    "id": "p_raphinha",
    "name": "رافينيا دياز",
    "aliases": [
      "رافينيا",
      "raphinha"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "أفاي",
      "فيتوريا غيمارايش",
      "سبورتينغ لشبونة",
      "رين",
      "ليدز يونايتد",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "FWD",
    "traits": [
      "قائد_برشلونة",
      "ضغط_شديد_وهداف",
      "هاتريك_بايرن"
    ],
    "trophies": [
      "الدوري الإسباني",
      "كأس السوبر الإسباني",
      "كأس البرتغال"
    ]
  },
  {
    "id": "p_alejandro_balde",
    "name": "أليخاندرو بالدي",
    "aliases": [
      "بالدي",
      "balde",
      "alejandro"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "DEF",
    "traits": [
      "ظهير_أيسر_سريع",
      "انطلاقات_صاروخية"
    ],
    "trophies": [
      "الدوري الإسباني",
      "كأس السوبر الإسباني"
    ]
  },
  {
    "id": "p_inigo_martinez",
    "name": "إينييغو مارتينيز",
    "aliases": [
      "إينييغو",
      "inigo martinez"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "ريال سوسيداد",
      "أتلتيك بيلباو",
      "برشلونة"
    ],
    "currentClub": "برشلونة",
    "position": "DEF",
    "traits": [
      "مصيدة_التسلل",
      "مدافع_خبير"
    ],
    "trophies": [
      "كأس السوبر الإسباني"
    ]
  },
  {
    "id": "p_endrick",
    "name": "إندريك فيليبي",
    "aliases": [
      "إندريك",
      "بوبي",
      "endrick"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "بالميراس",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "FWD",
    "traits": [
      "قوة_انفجارية_شابة",
      "تسديد_مباشر_بالمرمى"
    ],
    "trophies": [
      "الدوري البرازيلي",
      "كأس السوبر الأوروبي"
    ]
  },
  {
    "id": "p_ferland_mendy",
    "name": "فيرلاند ميندي",
    "aliases": [
      "ميندي",
      "الجدار الخرساني",
      "ferland mendy"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "لوهافر",
      "ليون",
      "ريال مدريد"
    ],
    "currentClub": "ريال مدريد",
    "position": "DEF",
    "traits": [
      "أفضل_ظهير_دفاعي_في_العالم",
      "صعب_المراوغة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإسباني"
    ]
  },
  {
    "id": "p_conor_gallagher",
    "name": "كونور غالاغير",
    "aliases": [
      "غالاغير",
      "gallagher",
      "conor"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB-ENG",
    "clubs": [
      "تشارلتون",
      "سوانزي",
      "وست بروميتش",
      "كريستال بالاس",
      "تشيلسي",
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "MID",
    "traits": [
      "طاقة_وضغط_عالي",
      "قاطع_كرات"
    ],
    "trophies": [
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_robin_le_normand",
    "name": "روبن لو نورماند",
    "aliases": [
      "لو نورماند",
      "le normand",
      "robin"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "بريست",
      "ريال سوسيداد",
      "أتلتيكو مدريد"
    ],
    "currentClub": "أتلتيكو مدريد",
    "position": "DEF",
    "traits": [
      "بطل_أوروبا_2024",
      "مدافع_صلب"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "دوري الأمم الأوروبية",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_dayot_upamecano",
    "name": "دايوت أوباميكانو",
    "aliases": [
      "أوباميكانو",
      "upamecano",
      "dayot"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "سالزبورغ",
      "لايبزيغ",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "DEF",
    "traits": [
      "قوة_بدنية_هائلة",
      "سرعة_في_التغطية"
    ],
    "trophies": [
      "الدوري الألماني",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_vitinha",
    "name": "فيتينيا",
    "aliases": [
      "فيتينيا",
      "مهندس الوسط",
      "vitinha"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "بورتو",
      "وولفرهامبتون",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "MID",
    "traits": [
      "أفضل_لاعب_وسط_في_فرنسا",
      "توزيع_وتحكم_مطلق"
    ],
    "trophies": [
      "الدوري الفرنسي",
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_romario",
    "name": "روماريو",
    "aliases": [
      "القصير",
      "روماريو",
      "ألف هدف",
      "romario",
      "o baixinho"
    ],
    "nationality": "البرازيل",
    "nationalityCode": "BR",
    "clubs": [
      "فاسكو دا غاما",
      "أيندهوفن",
      "برشلونة",
      "فلامنغو",
      "فالنسيا",
      "فلومينينسي",
      "السد"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "بطل_العالم_1994",
      "أفضل_لاعب_في_العالم",
      "إنهاء_بمقدمة_الحذاء"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الإسباني",
      "الدوري الهولندي",
      "كوبا أمريكا"
    ]
  },
  {
    "id": "p_juan_roman_riquelme",
    "name": "خوان رومان ريكيلمي",
    "aliases": [
      "ريكيلمي",
      "آخر صانع ألعاب كلاسيكي",
      "riquelme",
      "roman"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "بوكا جونيورز",
      "برشلونة",
      "فياريال",
      "أرجنتينوس جونيورز"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "نصف_نهائي_الأبطال_مع_فياريال",
      "رؤية_وتحكم_خارق"
    ],
    "trophies": [
      "كوبا ليبرتادوريس",
      "ذهبية_الأولمبياد",
      "كأس إنتركونتيننتال"
    ]
  },
  {
    "id": "p_juan_sebastian_veron",
    "name": "خوان سيباستيان فيرون",
    "aliases": [
      "الساحرة الصغيرة",
      "فيرون",
      "veron",
      "la brujita"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "إستوديانتيس",
      "بوكا جونيورز",
      "سامبدوريا",
      "بارما",
      "لاتسيو",
      "مانشستر يونايتد",
      "تشيلسي",
      "إنتر ميلان"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "تمريرات_طويلة_بالميلي"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "الدوري الإنجليزي",
      "كوبا ليبرتادوريس",
      "كأس الاتحاد الأوروبي"
    ]
  },
  {
    "id": "p_hernan_crespo",
    "name": "هرنان كريسبو",
    "aliases": [
      "كريسبو",
      "crespo",
      "hernan"
    ],
    "nationality": "الأرجنتين",
    "nationalityCode": "AR",
    "clubs": [
      "ريفر بليت",
      "بارما",
      "لاتسيو",
      "إنتر ميلان",
      "تشيلسي",
      "ميلان",
      "جنوة"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "ثنائية_نهائي_إسطنبول_2005",
      "إنهاء_مثالي"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "الدوري الإيطالي",
      "كوبا ليبرتادوريس",
      "كأس الاتحاد الأوروبي"
    ]
  },
  {
    "id": "p_lothar_matthaus",
    "name": "لوثار ماتيوس",
    "aliases": [
      "ماتيوس",
      "matthaus",
      "lothar"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "بوروسيا مونشنغلادباخ",
      "بايرن ميونخ",
      "إنتر ميلان",
      "نيويورك متروستارز"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "بطل_العالم_1990",
      "الكرة_الذهبية_1990",
      "أكثر_من_لعب_في_المونديال"
    ],
    "trophies": [
      "كأس العالم",
      "الكرة الذهبية",
      "كأس أمم أوروبا",
      "الدوري الألماني",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_oliver_kahn",
    "name": "أوليفر كان",
    "aliases": [
      "البركان",
      "تيتان",
      "كان",
      "أفضل لاعب بمونديال 2002",
      "oliver kahn"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "كارلسروه",
      "بايرن ميونخ"
    ],
    "currentClub": "معتزل",
    "position": "GK",
    "traits": [
      "أسطورة",
      "أفضل_لاعب_في_كأس_العالم_2002",
      "شخصية_مرعبة_للمهاجمين"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "كأس أمم أوروبا",
      "الدوري الألماني",
      "كأس إنتركونتيننتال"
    ]
  },
  {
    "id": "p_michael_ballack",
    "name": "مايكل بالاك",
    "aliases": [
      "بالاك",
      "ballack",
      "michael"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "كايزرسلاوترن",
      "باير ليفركوزن",
      "بايرن ميونخ",
      "تشيلسي"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "قائد_المانشافت",
      "رأسيات_وتسديدات"
    ],
    "trophies": [
      "الدوري الألماني",
      "الدوري الإنجليزي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_miroslav_klose",
    "name": "ميروسلاف كلوزه",
    "aliases": [
      "كلوزه",
      "الهداف التاريخي لكأس العالم",
      "شقلبة كلوزه",
      "klose",
      "miroslav"
    ],
    "nationality": "ألمانيا",
    "nationalityCode": "DE",
    "clubs": [
      "كايزرسلاوترن",
      "فيردر بريمن",
      "بايرن ميونخ",
      "لاتسيو"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "بطل_العالم_2014",
      "الهداف_التاريخي_لكأس_العالم_16_هدف",
      "لعب_نظيف"
    ],
    "trophies": [
      "كأس العالم",
      "الدوري الألماني",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_roberto_baggio",
    "name": "روبرتو باجيو",
    "aliases": [
      "ذيل الحصان الإلهي",
      "باجيو",
      "الكرة الذهبية 1993",
      "baggio",
      "roberto"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "فيتشنزا",
      "فيورنتينا",
      "يوفنتوس",
      "ميلان",
      "بولونيا",
      "إنتر ميلان",
      "بريشيا"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية_1993",
      "سحر_وإبداع_خالص",
      "مونديال_1994"
    ],
    "trophies": [
      "الكرة الذهبية",
      "كأس الاتحاد الأوروبي",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_filippo_inzaghi",
    "name": "فيليبو إنزاغي",
    "aliases": [
      "سوبر بيبو",
      "إنزاغي",
      "ولد في مصيدة التسلل",
      "inzaghi",
      "pippo"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "بياتشينزا",
      "بارما",
      "أتالانتا",
      "يوفنتوس",
      "ميلان"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "بطل_العالم_2006",
      "ثنائية_نهائي_أثينا_2007",
      "حاسة_تهديف_لا_تخطئ"
    ],
    "trophies": [
      "كأس العالم",
      "دوري أبطال أوروبا",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_christian_vieri",
    "name": "كريستيان فييري",
    "aliases": [
      "بوبو فييري",
      "فييري",
      "vieri",
      "bobo"
    ],
    "nationality": "إيطاليا",
    "nationalityCode": "IT",
    "clubs": [
      "تورينو",
      "أتالانتا",
      "يوفنتوس",
      "أتلتيكو مدريد",
      "لاتسيو",
      "إنتر ميلان",
      "ميلان",
      "موناكو",
      "فيورنتينا"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هداف_الدوري_الإسباني_والإيطالي",
      "قوة_بدنية_مرعبة"
    ],
    "trophies": [
      "الدوري الإيطالي",
      "كأس الكؤوس الأوروبية",
      "كأس إيطاليا"
    ]
  },
  {
    "id": "p_michel_platini",
    "name": "ميشيل بلاتيني",
    "aliases": [
      "بلاتيني",
      "الكرة الذهبية 3 مرات متتالية",
      "platini",
      "michel"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "نانسي",
      "سانت إتيان",
      "يوفنتوس"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "3_كرات_ذهبية_متتالية",
      "9_أهداف_في_يورو_1984",
      "أستاذ_الكرات_الثابتة"
    ],
    "trophies": [
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "كأس أمم أوروبا",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_wesley_sneijder",
    "name": "ويسلي شنايدر",
    "aliases": [
      "شنايدر",
      "مهندس الثلاثية 2010",
      "sneijder",
      "wesley"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أياكس",
      "ريال مدريد",
      "إنتر ميلان",
      "غلطة سراي",
      "نيس",
      "الغرافة"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "بطل_الثلاثية_2010_مع_الإنتر",
      "تسديدات_بالقدمين"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "الدوري الإسباني",
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_robin_van_persie",
    "name": "روبن فان بيرسي",
    "aliases": [
      "فان بيرسي",
      "الهولندي الطائر ضد إسبانيا",
      "van persie",
      "rvp"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "فينورد",
      "أرسنال",
      "مانشستر يونايتد",
      "فنربخشة"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "هدف_الغطسة_الشهير_ضد_إسبانيا",
      "الهداف_التاريخي_لهولندا"
    ],
    "trophies": [
      "الدوري الإنجليزي",
      "كأس الاتحاد الأوروبي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_luis_figo",
    "name": "لويس فيغو",
    "aliases": [
      "فيغو",
      "رأس الخنزير بالكامب نو",
      "الكرة الذهبية 2000",
      "figo",
      "luis"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "سبورتينغ لشبونة",
      "برشلونة",
      "ريال مدريد",
      "إنتر ميلان"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية_2000",
      "الصفقة_الأكثر_جدلا_في_التاريخ",
      "عرضيات_مسطرة"
    ],
    "trophies": [
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "الدوري الإسباني",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_rui_costa",
    "name": "روي كوستا",
    "aliases": [
      "الموسيقار",
      "روي كوستا",
      "رئيس بنفيكا",
      "rui costa"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "بنفيكا",
      "فاسي",
      "فيورنتينا",
      "ميلان"
    ],
    "currentClub": "معتزل",
    "position": "MID",
    "traits": [
      "أسطورة",
      "صانع_ألعاب_تاريخي",
      "أناقة_وتمريرات_حاسمة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإيطالي",
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_eusebio",
    "name": "إيزيبيو",
    "aliases": [
      "الفهد الأسود",
      "إيزيبيو",
      "أسطورة بنفيكا",
      "eusebio"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "سبورتينغ لورنسو ماركيز",
      "بنفيكا",
      "بوسطن مينتمن",
      "مونتيري",
      "تورونتو ميت Important"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "الكرة_الذهبية_1965",
      "هداف_مونديال_1966_9_أهداف"
    ],
    "trophies": [
      "الكرة الذهبية",
      "دوري أبطال أوروبا",
      "الدوري البرتغالي"
    ]
  },
  {
    "id": "p_alan_shearer",
    "name": "ألان شيرار",
    "aliases": [
      "شيرار",
      "الهداف التاريخي للدوري الإنجليزي",
      "احتفال اليد المرفوعة",
      "shearer",
      "alan"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB-ENG",
    "clubs": [
      "ساوثهامبتون",
      "بلاكبيرن روفرز",
      "نيوكاسل"
    ],
    "currentClub": "معتزل",
    "position": "FWD",
    "traits": [
      "أسطورة",
      "الهداف_التاريخي_للبريميرليغ_260_هدف",
      "رأسيات_وقوة_بدنية"
    ],
    "trophies": [
      "الدوري الإنجليزي"
    ]
  },
  {
    "id": "p_sofyan_amrabat",
    "name": "سفيان أمرابط",
    "aliases": [
      "أمرابط",
      "دينامو المغرب",
      "sofyan amrabat"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "أوتريخت",
      "فينورد",
      "كلوب بروج",
      "هيلاس فيرونا",
      "فيورنتينا",
      "مانشستر يونايتد",
      "فنربخشة"
    ],
    "currentClub": "فنربخشة",
    "position": "MID",
    "traits": [
      "بطل_إنجاز_المغرب_2022",
      "افتكاك_شديد_للكرة"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي",
      "كأس هولندا"
    ]
  },
  {
    "id": "p_nayef_aguerd",
    "name": "نايف أكرد",
    "aliases": [
      "أكرد",
      "nayef aguerd"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "الفتح الرباطي",
      "ديجون",
      "رين",
      "وست هام",
      "ريال سوسيداد"
    ],
    "currentClub": "ريال سوسيداد",
    "position": "DEF",
    "traits": [
      "قلب_دفاع_أعسر",
      "رأسيات_وارتقاء_عالي"
    ],
    "trophies": [
      "دوري المؤتمر الأوروبي"
    ]
  },
  {
    "id": "p_azzedine_ounahi",
    "name": "عز الدين أوناحي",
    "aliases": [
      "أوناحي",
      "رقم 8 المغربي",
      "ounahi",
      "azzedine"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "أفرانش",
      "أنجيه",
      "مارسيليا",
      "باناثينايكوس"
    ],
    "currentClub": "باناثينايكوس",
    "position": "MID",
    "traits": [
      "أبهر_إنريكي_في_مونديال_قطر",
      "مراوغات_بالقدمين"
    ],
    "trophies": []
  },
  {
    "id": "p_hakim_ziyech",
    "name": "حكيم زياش",
    "aliases": [
      "الساحر",
      "زياش",
      "العياش",
      "ziyech",
      "hakim"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "هيرنفين",
      "تفينتي",
      "أياكس",
      "تشيلسي",
      "غلطة سراي"
    ],
    "currentClub": "غلطة سراي",
    "position": "FWD",
    "traits": [
      "عرضيات_مليمترية",
      "تسديدات_يسارية_ملتفة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الهولندي",
      "الدوري التركي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_ismael_bennacer",
    "name": "إسماعيل بن ناصر",
    "aliases": [
      "بن ناصر",
      "أفضل لاعب بأمم إفريقيا 2019",
      "bennacer",
      "ismael"
    ],
    "nationality": "الجزائر",
    "nationalityCode": "DZ",
    "clubs": [
      "أرليه أفينيون",
      "أرسنال",
      "تور",
      "إمبولي",
      "ميلان"
    ],
    "currentClub": "ميلان",
    "position": "MID",
    "traits": [
      "محور_عصري",
      "افتكاك_وتوزيع",
      "بطل_إفريقيا_2019"
    ],
    "trophies": [
      "كأس أمم إفريقيا",
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_baghdad_bounedjah",
    "name": "بغداد بونجاح",
    "aliases": [
      "بونجاح",
      "السفاح",
      "هدف نهائي إفريقيا 2019",
      "bounedjah",
      "baghdad"
    ],
    "nationality": "الجزائر",
    "nationalityCode": "DZ",
    "clubs": [
      "اتحاد الحراش",
      "النجم الساحلي",
      "السد",
      "الشمال"
    ],
    "currentClub": "الشمال",
    "position": "FWD",
    "traits": [
      "هداف_تاريخي",
      "قتالي_للغاية",
      "بطل_إفريقيا_2019"
    ],
    "trophies": [
      "كأس أمم إفريقيا",
      "الدوري القطري",
      "كأس العرب"
    ]
  },
  {
    "id": "p_soufiane_rahimi",
    "name": "سفيان رحيمي",
    "aliases": [
      "رحيمي",
      "هداف أولمبياد باريس",
      "rahimi",
      "soufiane"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "الرجاء",
      "العين"
    ],
    "currentClub": "العين",
    "position": "FWD",
    "traits": [
      "هداف_دوري_أبطال_آسيا_2024",
      "هداف_أولمبياد_باريس_8_أهداف",
      "سريع_وحاسم"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "كأس الكونفدرالية",
      "برونزية_الأولمبياد"
    ]
  },
  {
    "id": "p_kodjo_laba",
    "name": "كودجو لابا",
    "aliases": [
      "لابا",
      "كودجو",
      "kodjo laba"
    ],
    "nationality": "توغو",
    "nationalityCode": "TG",
    "clubs": [
      "أنجيه نوتسي",
      "بيطام",
      "نهضة بركان",
      "العين"
    ],
    "currentClub": "العين",
    "position": "FWD",
    "traits": [
      "هداف_الدوري_الإماراتي_التاريخي",
      "قوة_بدنية_مرعبة"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري الإماراتي",
      "كأس الكونفدرالية"
    ]
  },
  {
    "id": "p_ali_mabkhout",
    "name": "علي مبخوت",
    "aliases": [
      "مبخوت",
      "الهداف التاريخي لمنتخب الإمارات",
      "ali mabkhout"
    ],
    "nationality": "الإمارات",
    "nationalityCode": "AE",
    "clubs": [
      "الجزيرة",
      "النصر الإماراتي"
    ],
    "currentClub": "النصر الإماراتي",
    "position": "FWD",
    "traits": [
      "الهداف_التاريخي_للدوري_الإماراتي",
      "أسرع_هدف_في_تاريخ_كأس_آسيا"
    ],
    "trophies": [
      "الدوري الإماراتي",
      "كأس الخليج"
    ]
  },
  {
    "id": "p_omar_khribin",
    "name": "عمر خربين",
    "aliases": [
      "خربين",
      "أفضل لاعب بآسيا 2017",
      "omar khribin"
    ],
    "nationality": "سوريا",
    "nationalityCode": "SY",
    "clubs": [
      "الوحدة السوري",
      "القوة الجوية",
      "الميناء",
      "الظفرة",
      "الهلال",
      "بيراميدز",
      "الوحدة الإماراتي",
      "شباب الأهلي"
    ],
    "currentClub": "الوحدة الإماراتي",
    "position": "FWD",
    "traits": [
      "أفضل_لاعب_في_آسيا_2017",
      "هاتريك_بيرسبوليس",
      "لعب_بالسعودية"
    ],
    "trophies": [
      "دوري أبطال آسيا",
      "الدوري السعودي",
      "الدوري الإماراتي"
    ]
  },
  {
    "id": "p_mehdi_taremi",
    "name": "مهدي طارمي",
    "aliases": [
      "طارمي",
      "مقصية تشيلسي الشهيرة",
      "taremi",
      "mehdi"
    ],
    "nationality": "إيران",
    "nationalityCode": "IR",
    "clubs": [
      "شاهين بوشهر",
      "إيرانجوان",
      "برسبوليس",
      "الغرافة",
      "ريو أفي",
      "بورتو",
      "إنتر ميلان"
    ],
    "currentClub": "إنتر ميلان",
    "position": "FWD",
    "traits": [
      "هداف_الدوري_البرتغالي",
      "ذكي_في_كسب_الجزائيات",
      "أهداف_بهلوانية"
    ],
    "trophies": [
      "الدوري البرتغالي",
      "كأس البرتغال"
    ]
  },
  {
    "id": "p_kim_min_jae",
    "name": "كيم مين جاي",
    "aliases": [
      "الوحش",
      "كيم",
      "صخرة نابولي",
      "kim min-jae"
    ],
    "nationality": "كوريا الجنوبية",
    "nationalityCode": "KR",
    "clubs": [
      "جيونبوك",
      "بكين غوان",
      "فنربخشة",
      "نابولي",
      "بايرن ميونخ"
    ],
    "currentClub": "بايرن ميونخ",
    "position": "DEF",
    "traits": [
      "أفضل_مدافع_في_الدوري_الإيطالي_2023",
      "قوة_وسرعة_استثنائية"
    ],
    "trophies": [
      "الدوري الإيطالي"
    ]
  },
  {
    "id": "p_kaoru_mitoma",
    "name": "كاورو ميتوما",
    "aliases": [
      "ميتوما",
      "دكتور المراوغات",
      "mitoma",
      "kaoru"
    ],
    "nationality": "اليابان",
    "nationalityCode": "JP",
    "clubs": [
      "كاواساكي فرونتال",
      "رويال يونيون",
      "برايتون"
    ],
    "currentClub": "برايتون",
    "position": "FWD",
    "traits": [
      "أطروحة_جامعية_في_المراوغة",
      "تغيير_اتجاه_لا_يصدق"
    ],
    "trophies": [
      "الدوري الياباني"
    ]
  },
  {
    "id": "p_wataru_endo",
    "name": "واتارو إندو",
    "aliases": [
      "إندو",
      "واقي الأسنان",
      "endo",
      "wataru"
    ],
    "nationality": "اليابان",
    "nationalityCode": "JP",
    "clubs": [
      "شونان بلمار",
      "أوراوا ريد دياموندز",
      "سينت ترويدن",
      "شتوتغارت",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "MID",
    "traits": [
      "قائد_اليابان",
      "محارب_خط_الوسط",
      "افتكاك_شجاع"
    ],
    "trophies": [
      "كأس الرابطة الإنجليزية",
      "دوري أبطال آسيا"
    ]
  },
  {
    "id": "p_lee_kang_in",
    "name": "لي كانغ إن",
    "aliases": [
      "لي",
      "الجوهرة الكورية",
      "lee kang-in"
    ],
    "nationality": "كوريا الجنوبية",
    "nationalityCode": "KR",
    "clubs": [
      "فالنسيا",
      "مايوركا",
      "باريس سان جيرمان"
    ],
    "currentClub": "باريس سان جيرمان",
    "position": "MID",
    "traits": [
      "أفضل_لاعب_بمونديال_الشباب_2019",
      "قدم_يسرى_ساحرة"
    ],
    "trophies": [
      "الدوري الفرنسي",
      "كأس ملك إسبانيا"
    ]
  },
  {
    "id": "p_john_stones",
    "name": "جون ستونز",
    "aliases": [
      "ستونز",
      "إنقاذ خط المرمى 11 ملم",
      "stones",
      "john"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB-ENG",
    "clubs": [
      "بارنسلي",
      "إيفرتون",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "DEF",
    "traits": [
      "مدافع_ولاعب_وسط",
      "بطل_الثلاثية_التاريخية_2023"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_kyle_walker",
    "name": "كايل ووكر",
    "aliases": [
      "ووكر",
      "أسرع ظهير في العالم",
      "walker",
      "kyle"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB-ENG",
    "clubs": [
      "شيفيلد يونايتد",
      "أستون فيلا",
      "توتنهام",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "DEF",
    "traits": [
      "سرعة_خارقة_لإيقاف_فينيسيوس_ومبابي",
      "قائد"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_jack_grealish",
    "name": "جاك غريليش",
    "aliases": [
      "غريليش",
      "الجوارب القصيرة",
      "grealish",
      "jack"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB-ENG",
    "clubs": [
      "أستون فيلا",
      "نوتس كاونتي",
      "مانشستر سيتي"
    ],
    "currentClub": "مانشستر سيتي",
    "position": "FWD",
    "traits": [
      "حفظ_الكرة_وكسب_الأخطاء",
      "مراوغ_مهاري"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_diogo_jota",
    "name": "ديوغو جوتا",
    "aliases": [
      "جوتا",
      "محترف فيفا",
      "jota",
      "diogo"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "باسوش دي فيريرا",
      "أتلتيكو مدريد",
      "بورتو",
      "وولفرهامبتون",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "FWD",
    "traits": [
      "رأسيات_قاتلة_رغم_قصر_القامة",
      "إنهاء_لا_يرحم"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي",
      "كأس الرابطة الإنجليزية",
      "دوري الأمم الأوروبية"
    ]
  },
  {
    "id": "p_ibrahima_konate",
    "name": "إبراهيما كوناتي",
    "aliases": [
      "كوناتي",
      "إيبو",
      "konate",
      "ibou"
    ],
    "nationality": "فرنسا",
    "nationalityCode": "FR",
    "clubs": [
      "سوشو",
      "لايبزيغ",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "DEF",
    "traits": [
      "عملاق_الدفاع",
      "سرعة_وقوة_في_الصراعات_الهوائية"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي",
      "كأس الرابطة الإنجليزية"
    ]
  },
  {
    "id": "p_andrew_robertson",
    "name": "أندرو روبرتسون",
    "aliases": [
      "روبو",
      "روبرتسون",
      "robertson",
      "andy"
    ],
    "nationality": "إسكتلندا",
    "nationalityCode": "GB-SCT",
    "clubs": [
      "كوينز بارك",
      "دندي يونايتد",
      "هال سيتي",
      "ليفربول"
    ],
    "currentClub": "ليفربول",
    "position": "DEF",
    "traits": [
      "قائد_إسكتلندا",
      "ضغط_جري_لا_يتوقف",
      "عرضيات_حاسمة"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الإنجليزي",
      "كأس العالم للأندية"
    ]
  },
  {
    "id": "p_matthijs_de_ligt",
    "name": "ماتياس دي ليخت",
    "aliases": [
      "دي ليخت",
      "قائد أياكس الذهبي",
      "de ligt",
      "matthijs"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أياكس",
      "يوفنتوس",
      "بايرن ميونخ",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "DEF",
    "traits": [
      "أصغر_قائد_في_نصف_نهائي_الأبطال",
      "قوة_بدنية_ورأسيات"
    ],
    "trophies": [
      "الدوري الهولندي",
      "الدوري الإيطالي",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_noussair_mazraoui",
    "name": "نصير مزراوي",
    "aliases": [
      "مزراوي",
      "mazraoui",
      "noussair"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "أياكس",
      "بايرن ميونخ",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "DEF",
    "traits": [
      "بطل_إنجاز_المغرب_2022",
      "ظهير_أنيق_ومتعدد_المراكز"
    ],
    "trophies": [
      "الدوري الهولندي",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_christian_eriksen",
    "name": "كريستيان إريكسن",
    "aliases": [
      "إريكسن",
      "القلب النابض",
      "eriksen",
      "christian"
    ],
    "nationality": "الدنمارك",
    "nationalityCode": "DK",
    "clubs": [
      "أياكس",
      "توتنهام",
      "إنتر ميلان",
      "برينتفورد",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "MID",
    "traits": [
      "معجزة_العودة_للملاعب",
      "رؤية_وتمريرات_حاسمة"
    ],
    "trophies": [
      "الدوري الهولندي",
      "الدوري الإيطالي",
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_amad_diallo",
    "name": "أماد ديالو",
    "aliases": [
      "ديالو",
      "هدف ليفربول في الدقيقة 120",
      "diallo",
      "amad"
    ],
    "nationality": "ساحل العاج",
    "nationalityCode": "CI",
    "clubs": [
      "أتالانتا",
      "رينجرز",
      "سندرلاند",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "FWD",
    "traits": [
      "هدف_تاريخي_ضد_ليفربول",
      "مهارة_وسرعة"
    ],
    "trophies": [
      "كأس الاتحاد الإنجليزي"
    ]
  },
  {
    "id": "p_joshua_zirkzee",
    "name": "جوشوا زيركزي",
    "aliases": [
      "زيركزي",
      "zirkzee",
      "joshua"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "فاينورد_شباب",
      "بايرن ميونخ",
      "بارما",
      "أندرلخت",
      "بولونيا",
      "مانشستر يونايتد"
    ],
    "currentClub": "مانشستر يونايتد",
    "position": "FWD",
    "traits": [
      "مهاجم_محطة_مهاري_للغاية",
      "تأهل_تاريخي_لبولونيا_للأبطال"
    ],
    "trophies": [
      "دوري أبطال أوروبا",
      "الدوري الألماني"
    ]
  },
  {
    "id": "p_youssef_en_nesyri",
    "name": "يوسف النصيري",
    "aliases": [
      "النصيري",
      "قفزة البرتغال التاريخية",
      "en-nesyri"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "ملقا",
      "ليغانيس",
      "إشبيلية",
      "فنربخشة"
    ],
    "currentClub": "فنربخشة",
    "position": "FWD",
    "traits": [
      "ارتقاء_تاريخي_2.78_متر_ضد_البرتغال",
      "بطل_الدوري_الأوروبي"
    ],
    "trophies": [
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_ayoub_el_kaabi",
    "name": "أيوب الكعبي",
    "aliases": [
      "الكعبي",
      "هداف دوري المؤتمر التاريخي",
      "el kaabi"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "الراسينغ البيضاوي",
      "نهضة بركان",
      "هيبي فورتشن",
      "الوداد",
      "هاتاي سبور",
      "السد",
      "أولمبياكوس"
    ],
    "currentClub": "أولمبياكوس",
    "position": "FWD",
    "traits": [
      "هداف_دوري_المؤتمر_الأوروبي_11_هدف",
      "مقصيات_شهيرة"
    ],
    "trophies": [
      "دوري المؤتمر الأوروبي",
      "كأس أمم إفريقيا للمحليين"
    ]
  },
  {
    "id": "p_soufiane_boufal",
    "name": "سفيان بوفال",
    "aliases": [
      "بوفال",
      "أفضل مراوغ في الليغا",
      "boufal"
    ],
    "nationality": "المغرب",
    "nationalityCode": "MA",
    "clubs": [
      "أنجيه",
      "ليل",
      "ساوثهامبتون",
      "سيلتا فيغو",
      "الريان",
      "يونيون سانت جيلواز"
    ],
    "currentClub": "يونيون سانت جيلواز",
    "position": "FWD",
    "traits": [
      "مراوغات_إعجازية",
      "بطل_إنجاز_المغرب_2022"
    ],
    "trophies": []
  },
  {
    "id": "p_jurrien_timber",
    "name": "يوريان تيمبر",
    "aliases": [
      "تيمبر",
      "timber",
      "jurrien"
    ],
    "nationality": "هولندا",
    "nationalityCode": "NL",
    "clubs": [
      "أياكس",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "DEF",
    "traits": [
      "مدافع_عصري_متنوع",
      "تدرج_خارق_بالكرة"
    ],
    "trophies": [
      "الدوري الهولندي"
    ]
  },
  {
    "id": "p_leandro_trossard",
    "name": "لياندرو تروسارد",
    "aliases": [
      "تروسارد",
      "الساحر البلجيكي",
      "احتفال النظارات",
      "trossard"
    ],
    "nationality": "بلجيكا",
    "nationalityCode": "BE",
    "clubs": [
      "جينك",
      "لوميل",
      "فيسترلو",
      "أود هيفيرلي لوفين",
      "برايتون",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "FWD",
    "traits": [
      "البديل_السوبر_القاتل",
      "هاتريك_أنفيلد"
    ],
    "trophies": [
      "الدوري البلجيكي"
    ]
  },
  {
    "id": "p_ben_white",
    "name": "بن وايت",
    "aliases": [
      "وايت",
      "ben white"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB-ENG",
    "clubs": [
      "برايتون",
      "نيوبورت",
      "بيتربورو",
      "ليدز يونايتد",
      "أرسنال"
    ],
    "currentClub": "أرسنال",
    "position": "DEF",
    "traits": [
      "تداخل_تكتيكي_وذكاء",
      "هدوء_في_الخروج_بالكرة"
    ],
    "trophies": [
      "درع المجتمع"
    ]
  },
  {
    "id": "p_eberechi_eze",
    "name": "إيبيريتشي إيزي",
    "aliases": [
      "إيزي",
      "eze",
      "eberechi"
    ],
    "nationality": "إنجلترا",
    "nationalityCode": "GB-ENG",
    "clubs": [
      "كوينز بارك رينجرز",
      "ويكمب",
      "كريستال بالاس"
    ],
    "currentClub": "كريستال بالاس",
    "position": "MID",
    "traits": [
      "سلاسة_المراوغة_والتحكم",
      "تسديدات_قوسية"
    ],
    "trophies": []
  },
  {
    "id": "p_bryan_mbeumo",
    "name": "برايان مبيومو",
    "aliases": [
      "مبيومو",
      "نجم برينتفورد",
      "mbeumo"
    ],
    "nationality": "الكاميرون",
    "nationalityCode": "CM",
    "clubs": [
      "تروا",
      "برينتفورد"
    ],
    "currentClub": "برينتفورد",
    "position": "FWD",
    "traits": [
      "سرعة_وإنهاء_حاسم",
      "أهداف_في_الدقائق_الأولى"
    ],
    "trophies": []
  },
  {
    "id": "p_pedro_neto",
    "name": "بيدرو نيتو",
    "aliases": [
      "نيتو",
      "neto",
      "pedro"
    ],
    "nationality": "البرتغال",
    "nationalityCode": "PT",
    "clubs": [
      "براغا",
      "لاتسيو",
      "وولفرهامبتون",
      "تشيلسي"
    ],
    "currentClub": "تشيلسي",
    "position": "FWD",
    "traits": [
      "سرعة_انفجارية",
      "مراوغات_خطية"
    ],
    "trophies": []
  },
  {
    "id": "p_alex_baena",
    "name": "أليكس باينا",
    "aliases": [
      "باينا",
      "ملك الأسيست بالليغا",
      "baena",
      "alex"
    ],
    "nationality": "إسبانيا",
    "nationalityCode": "ES",
    "clubs": [
      "فياريال",
      "جيرونا"
    ],
    "currentClub": "فياريال",
    "position": "MID",
    "traits": [
      "أكثر_صانع_أهداف_في_الليغا",
      "بطل_أوروبا_2024",
      "ذهبية_أولمبياد_باريس"
    ],
    "trophies": [
      "كأس أمم أوروبا",
      "ذهبية_الأولمبياد",
      "الدوري الأوروبي"
    ]
  },
  {
    "id": "p_emam_ashour",
    "name": "إمام عاشور",
    "aliases": [
      "عاشور",
      "مايسترو الأهلي",
      "emam ashour"
    ],
    "nationality": "مصر",
    "nationalityCode": "EG",
    "clubs": [
      "غزل المحلة",
      "حرس الحدود",
      "الزمالك",
      "ميتييلاند",
      "الأهلي المصري"
    ],
    "currentClub": "الأهلي المصري",
    "position": "MID",
    "traits": [
      "تسديدات_صاروخية",
      "مهارة_وحيوية_كبيرة"
    ],
    "trophies": [
      "دوري أبطال إفريقيا",
      "الدوري المصري",
      "كأس السوبر الإفريقي"
    ]
  },
  {
    "id": "p_ahmed_sayed_zizo",
    "name": "أحمد سيد زيزو",
    "aliases": [
      "زيزو",
      "نجم الزمالك الأول",
      "zizo"
    ],
    "nationality": "مصر",
    "nationalityCode": "EG",
    "clubs": [
      "ليرس",
      "ناسيونال ماديرا",
      "موريرينسي",
      "الزمالك"
    ],
    "currentClub": "الزمالك",
    "position": "FWD",
    "traits": [
      "أفضل_صانع_وهداف_بالدوري_المصري",
      "عرضيات_وذكاء_تكتيكي"
    ],
    "trophies": [
      "كأس الكونفدرالية",
      "الدوري المصري",
      "كأس السوبر الإفريقي"
    ]
  },
  {
    "id": "p_mohamed_elshenawy",
    "name": "محمد الشناوي",
    "aliases": [
      "الشناوي",
      "سد الأهلي العالي",
      "elshenawy"
    ],
    "nationality": "مصر",
    "nationalityCode": "EG",
    "clubs": [
      "الأهلي المصري",
      "طلائع الجيش",
      "حرس الحدود",
      "بتروجيت"
    ],
    "currentClub": "الأهلي المصري",
    "position": "GK",
    "traits": [
      "قائد_الأهلي_التاريخي",
      "تصدي_ضربات_جزاء_المونديال"
    ],
    "trophies": [
      "دوري أبطال إفريقيا",
      "الدوري المصري",
      "برونزية_كأس_العالم_للأندية"
    ]
  },
  {
    "id": "p_ali_maaloul",
    "name": "علي معلول",
    "aliases": [
      "معلول",
      "علولو",
      "ملك الحلول",
      "ali maaloul"
    ],
    "nationality": "تونس",
    "nationalityCode": "TN",
    "clubs": [
      "الصفاقسي",
      "الأهلي المصري"
    ],
    "currentClub": "الأهلي المصري",
    "position": "DEF",
    "traits": [
      "أعظم_ظهير_أيسر_في_تاريخ_الأهلي_وإفريقيا",
      "أهداف_وتمريرات_حاسمة"
    ],
    "trophies": [
      "دوري أبطال إفريقيا",
      "الدوري المصري",
      "كأس الكونفدرالية"
    ]
  }
];

// Map of canonical club names to local asset paths
export const LOCAL_CLUB_LOGOS: Record<string, string> = {
  'الهلال': '/assets/football/clubs/al_hilal.png',
  'النصر': '/assets/football/clubs/al_nassr.png',
  'الاتحاد': '/assets/football/clubs/al_ittihad.png',
  'الأهلي': '/assets/football/clubs/al_ahli.png',
  'الأهلي السعودي': '/assets/football/clubs/al_ahli.png',
  'ريال مدريد': '/assets/football/clubs/real_madrid.png',
  'برشلونة': '/assets/football/clubs/barcelona.png',
  'مانشستر سيتي': '/assets/football/clubs/man_city.png',
  'مانشستر يونايتد': '/assets/football/clubs/man_united.png',
  'بايرن ميونخ': '/assets/football/clubs/bayern.png',
  'باريس سان جيرمان': '/assets/football/clubs/psg.png',
  'ليفربول': '/assets/football/clubs/liverpool.png',
  'أرسنال': '/assets/football/clubs/arsenal.png',
  'تشيلسي': '/assets/football/clubs/chelsea.png',
  'يوفنتوس': '/assets/football/clubs/juventus.png',
  'ميلان': '/assets/football/clubs/ac_milan.png',
  'إيه سي ميلان': '/assets/football/clubs/ac_milan.png',
  'إنتر ميلان': '/assets/football/clubs/inter.png',
  'إنتر': '/assets/football/clubs/inter.png',
};

// Map of canonical country names to local flag paths
export const LOCAL_COUNTRY_FLAGS: Record<string, string> = {
  'السعودية': '/assets/football/flags/sa.png',
  'البرازيل': '/assets/football/flags/br.png',
  'الأرجنتين': '/assets/football/flags/ar.png',
  'فرنسا': '/assets/football/flags/fr.png',
  'البرتغال': '/assets/football/flags/pt.png',
  'إسبانيا': '/assets/football/flags/es.png',
  'ألمانيا': '/assets/football/flags/de.png',
  'مصر': '/assets/football/flags/eg.png',
  'المغرب': '/assets/football/flags/ma.png',
  'كرواتيا': '/assets/football/flags/hr.png',
};

// Map of player identifiers / names to local photo paths
export const LOCAL_PLAYER_PHOTOS: Record<string, string> = {
  'p_salem_dawsari': '/assets/football/players/salem_aldawsari.jpg',
  'سالم الدوسري': '/assets/football/players/salem_aldawsari.jpg',
  'p_cristiano_ronaldo': '/assets/football/players/ronaldo.jpg',
  'كريستيانو رونالدو': '/assets/football/players/ronaldo.jpg',
  'p_lionel_messi': '/assets/football/players/messi.jpg',
  'ليونيل ميسي': '/assets/football/players/messi.jpg',
  'p_karim_benzema': '/assets/football/players/benzema.jpg',
  'كريم بنزيما': '/assets/football/players/benzema.jpg',
  'p_ngolo_kante': '/assets/football/players/kante.jpg',
  'نغولو كانتي': '/assets/football/players/kante.jpg',
  'p_neymar_jr': '/assets/football/players/neymar.jpg',
  'نيمار دا سيلفا': '/assets/football/players/neymar.jpg',
  'p_riyad_mahrez': '/assets/football/players/mahrez.jpg',
  'رياض محرز': '/assets/football/players/mahrez.jpg',
  'p_luka_modric': '/assets/football/players/modric.jpg',
  'لوكا مودريتش': '/assets/football/players/modric.jpg',
  'p_vinicius_jr': '/assets/football/players/vinicius.jpg',
  'فينيسيوس جونيور': '/assets/football/players/vinicius.jpg',
  'p_erling_haaland': '/assets/football/players/haaland.jpg',
  'إيرلينغ هالاند': '/assets/football/players/haaland.jpg',
  'p_ali_albulayhi': '/assets/football/players/albulayhi.jpg',
  'علي البليهي': '/assets/football/players/albulayhi.jpg',
  'p_firas_alburaikan': '/assets/football/players/alburaikan.jpg',
  'فراس البريكان': '/assets/football/players/alburaikan.jpg',
  'p_thomas_muller': '/assets/football/players/muller.jpg',
  'توماس مولر': '/assets/football/players/muller.jpg',
  'p_toni_kroos': '/assets/football/players/kroos.jpg',
  'توني كروس': '/assets/football/players/kroos.jpg',
  'p_kylian_mbappe': '/assets/football/players/mbappe.jpg',
  'كيليان مبابي': '/assets/football/players/mbappe.jpg',
  'p_mohamed_salah': '/assets/football/players/salah.jpg',
  'محمد صلاح': '/assets/football/players/salah.jpg',
  'p_thibaut_courtois': '/assets/football/players/courtois.jpg',
  'تيبو كورتوا': '/assets/football/players/courtois.jpg',
  'p_yassine_bounou': '/assets/football/players/bono.jpg',
  'ياسين بونو': '/assets/football/players/bono.jpg',
  'p_kevin_de_bruyne': '/assets/football/players/debruyne.jpg',
  'كيفين دي بروين': '/assets/football/players/debruyne.jpg',
  'p_sadio_mane': '/assets/football/players/mane.jpg',
  'ساديو ماني': '/assets/football/players/mane.jpg',
  'p_roberto_firmino': '/assets/football/players/firmino.jpg',
  'روبرتو فيرمينو': '/assets/football/players/firmino.jpg',
  'p_franck_kessie': '/assets/football/players/kessie.jpg',
  'فرانك كيسييه': '/assets/football/players/kessie.jpg',
  'p_edouard_mendy': '/assets/football/players/mendy.jpg',
  'فيرلاند ميندي': '/assets/football/players/mendy.jpg',
  'p_ruben_neves': '/assets/football/players/neves.jpg',
  'روبن نيفيز': '/assets/football/players/neves.jpg',
  'p_aleksandar_mitrovic': '/assets/football/players/mitrovic.jpg',
  'ألكسندر ميتروفيتش': '/assets/football/players/mitrovic.jpg',
  'p_kalidou_koulibaly': '/assets/football/players/koulibaly.jpg',
  'خاليدو كوليبالي': '/assets/football/players/koulibaly.jpg',
  'p_joao_cancelo': '/assets/football/players/cancelo.jpg',
  'جواو كانسيلو': '/assets/football/players/cancelo.jpg',
  'p_saud_abdulhamid': '/assets/football/players/saud_abdulhamid.jpg',
  'سعود عبد الحميد': '/assets/football/players/saud_abdulhamid.jpg',
  'p_jude_bellingham': '/assets/football/players/bellingham.jpg',
  'جود بيلينغهام': '/assets/football/players/bellingham.jpg',
  'p_robert_lewandowski': '/assets/football/players/lewandowski.jpg',
  'روبرت ليفاندوفسكي': '/assets/football/players/lewandowski.jpg',
  'p_cole_palmer': '/assets/football/players/palmer.jpg',
  'كول بالمر': '/assets/football/players/palmer.jpg',
  'p_bukayo_saka': '/assets/football/players/saka.jpg',
  'بوكايو ساكا': '/assets/football/players/saka.jpg',
  'p_manuel_neuer': '/assets/football/players/neuer.jpg',
  'مانويل نوير': '/assets/football/players/neuer.jpg',
  'p_achraf_hakimi': '/assets/football/players/hakimi.jpg',
  'أشرف حكيمي': '/assets/football/players/hakimi.jpg',
  'p_zinedine_zidane': '/assets/football/players/zidane_player.jpg',
  'زين الدين زيدان': '/assets/football/players/zidane_player.jpg',
  'p_ronaldinho': '/assets/football/players/ronaldinho.jpg',
  'رونالدينيو': '/assets/football/players/ronaldinho.jpg',
  'p_sergio_ramos': '/assets/football/players/ramos.jpg',
  'سيرجيو راموس': '/assets/football/players/ramos.jpg',
  'p_alisson_becker': '/assets/football/players/alisson.jpg',
  'أليسون بيكر': '/assets/football/players/alisson.jpg',
};

export function getPlayerPhoto(player: FootballPlayer | string): string {
  if (typeof player === 'object' && player.photo) return player.photo;
  const key = typeof player === 'string' ? player : player.id;
  const name = typeof player === 'string' ? player : player.name;
  if (LOCAL_PLAYER_PHOTOS[key]) return LOCAL_PLAYER_PHOTOS[key];
  if (LOCAL_PLAYER_PHOTOS[name]) return LOCAL_PLAYER_PHOTOS[name];
  // Default clean soccer avatar
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%232C2A29"><circle cx="50" cy="35" r="22" fill="%238A9A5B"/><path d="M20 85 C20 60 80 60 80 85 Z" fill="%232C2A29"/></svg>`;
}

export function getClubLogo(clubName: string): string {
  if (LOCAL_CLUB_LOGOS[clubName]) return LOCAL_CLUB_LOGOS[clubName];
  // Check country flag if club is a country
  if (LOCAL_COUNTRY_FLAGS[clubName]) return LOCAL_COUNTRY_FLAGS[clubName];
  // Default clean shield badge
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 L85 25 L85 60 C85 75 50 92 50 92 C50 92 15 75 15 60 L15 25 Z" fill="%238A9A5B" stroke="%232C2A29" stroke-width="4"/><text x="50" y="58" font-size="28" text-anchor="middle" fill="%23F7F4EC">⚽</text></svg>`;
}

