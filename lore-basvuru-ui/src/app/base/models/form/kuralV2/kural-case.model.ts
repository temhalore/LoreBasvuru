/**
 * Her koşul satırı için görünürlük kararlarını tutan model.
 * hesaplaKuralCase() içinde her kosul için ayrı ayrı hesaplanır.
 */
export class KosulSatirCase {
  /** Operatör combo — Dosya Kısıtı'nda gizlenir */
  showOperator: boolean;

  /** Değer Tipi combo — Dosya Kısıtı'nda gizlenir */
  showDegerTipi: boolean;

  /** Secenek combo (SecenekEIdDto) — KosulTip = Seçenek Seçimi (2020002) */
  showSecenek: boolean;

  /**
   * Matris bilgi notu — MATRIS_TEK_SECIM veya MATRIS_COK_SECIM soru seçilince gösterilir.
   * Matris için seçenek combo'su gelecek fazda ayrıca implemente edilecek.
   */
  showMatrisNotu: boolean;

  /** Matris alanları (MatrisSatirEIdDto, MatrisSutunEIdDto) — matris soru için */
  showMatris: boolean;

  /** Deger input'u — Dosya Kısıtı ve Seçenek dışındaki tüm tipler */
  showDeger: boolean;

  /** Deger2 input'u — yalnızca Operator = Arasında (2030010) veya MinMaxKarakter */
  showDeger2: boolean;

  /** Dosya kısıtı özel alanları (MaxDosyaBoyutu, Min/MaxDosyaSayisi, IzinVerilenUzantilar) */
  showDosyaKisitAlanlari: boolean;

  /**
   * Değer 1 ve Değer 2 input bileşeninin tipi.
   * DegerTipi (DEGER_TIPI) combo seçimine göre belirlenir:
   *   SAYI (2050001)  → 'sayi'   → number input
   *   METIN (2050002) → 'metin'  → text input (default)
   *   TARIH (2050003) → 'tarih'  → datepicker
   */
  degerInputTip: 'sayi' | 'metin' | 'tarih';

  /** Deger input etiketi */
  degerLabel: string;

  /** Deger2 input etiketi */
  deger2Label: string;

  /** Koşul tipi combo'sunda gosterilecek ID listesi. Bos ise tum liste kullanilir. */
  izinVerilenKosulTipIdleri: number[];

  /** Operator combo'sunda gosterilecek ID listesi. Bos ise operator alanı gizlenir ya da tum liste kullanilir. */
  izinVerilenOperatorIdleri: number[];

  /** Deger tipi combo'sunda gosterilecek ID listesi. Bos ise deger tipi alani gizlenir ya da sabittir. */
  izinVerilenDegerTipiIdleri: number[];

  /** Deger tipi alaninin editor davranisi. */
  degerTipiMode: 'hidden' | 'fixed' | 'selectable';

  /** Deger tipi sabitse form degerine yazilacak ID. */
  fixedDegerTipiId: number | null;

  /**
   * Seçilen soru tipi SIRALAMA veya TEKRARLI_GRUP ise bu flag true olur.
   * Ekranda uyarı mesajı göstermek ve koşul eklemeyi engellemek için kullanılır.
   */
  showKuralDesteklenmezUyarisi: boolean;

  /** Uyarı satırında gösterilecek mesaj metni */
  kuralDesteklenmezMesaj: string;

  constructor() {
    this.showOperator = true;
    this.showDegerTipi = true;
    this.showSecenek = false;
    this.showMatrisNotu = false;
    this.showMatris = false;
    this.showDeger = true;
    this.showDeger2 = false;
    this.showDosyaKisitAlanlari = false;
    this.degerInputTip = 'metin';
    this.degerLabel = 'Değer';
    this.deger2Label = 'Değer 2';
    this.izinVerilenKosulTipIdleri = [];
    this.izinVerilenOperatorIdleri = [];
    this.izinVerilenDegerTipiIdleri = [];
    this.degerTipiMode = 'hidden';
    this.fixedDegerTipiId = null;
    this.showKuralDesteklenmezUyarisi = false;
    this.kuralDesteklenmezMesaj = '';
  }
}

/**
 * Kural formundaki tüm görünürlük/zorunluluk kararlarını tutan model.
 * hesaplaKuralCase() metodundan döner; template ve validator güncellemeleri
 * bu tek modeldeki alanlara göre çalışır.
 *
 * Yeni bir case eklendiğinde sadece bu model ve hesaplaKuralCase() güncellenir.
 */
export class KuralCaseModel {
  // ── Ana form alanları ──────────────────────────────────────────────────────

  /** FormSoruKokEIdDto combosunu göster — Validasyon tipi (2010001) */
  showSoruSecimi: boolean;

  /** FormSoruKokEIdDto için required validator aktif mi */
  soruZorunlu: boolean;

  /** HedefSayfaEIdDto combosunu göster — Sayfaya Yönlendir (2010002) */
  showSayfaSecimi: boolean;

  /** HedefSoruKokEIdDto combosunu göster — Soruya Yönlendir (2010003) */
  showHedefSoruSecimi: boolean;

  /** Koşullar listesini göster — kural tipi seçilmişse her zaman true */
  showKosullar: boolean;

  /**
   * Koşul içindeki SoruKokEIdDto combosunu göster.
   * Validasyon'da kaynak soru üstten (FormSoruKokEIdDto) geldiği için false.
   * Sayfa/Soru yönlendirmede her koşul kendi kaynağını seçer → true.
   */
  showKosulKaynakSoru: boolean;

  /**
   * Validasyon tipinde seçilen sorunun tipi (FormSoruKokEIdDto'nun soruTipKID'si).
   * 0 ise henüz soru seçilmemiş. Koşul satırlarına izin verilen koşul tiplerini
   * belirlemek için hesaplaKosulSatirCase() tarafından okunur.
   */
  validasyonSoruTipKID: number;

  /** Her koşul satırı için ayrı ayrı hesaplanan görünürlük bilgileri */
  kosulCases: KosulSatirCase[];

  constructor() {
    this.showSoruSecimi = false;
    this.soruZorunlu = false;
    this.showSayfaSecimi = false;
    this.showHedefSoruSecimi = false;
    this.showKosullar = false;
    this.showKosulKaynakSoru = false;
    this.validasyonSoruTipKID = 0;
    this.kosulCases = [];
  }
}
