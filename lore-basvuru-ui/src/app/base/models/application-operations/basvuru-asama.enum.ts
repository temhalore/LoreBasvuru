/**
 * Başvuru aşamaları (BASVURU_ASAMALARI_CHILD)
 * Backend etikkurul.common/DTO/Enums/AppEnums.cs ile senkronize tutulmalı.
 *
 * t_kod tablosundaki id'ler kaynak — magic number kullanmamak için bu enum üzerinden referans verilir.
 */
export enum BasvuruAsamasi {
  YENI_BASVURU = 1190001,
  DUZELTME = 1190002,
  KURULA_GONDERILDI = 1190003,
  TESLIM_ALINDI = 1190004,
  RAPORTORE_YONLENDIRILDI = 1190005,
  RAPOR_HAZIRLANDI = 1190006,
  UYGUN = 1190007,
  UYGUN_DEGIL = 1190008,
  GOREVSIZLIK = 1190009,
  SILINDI = 1190010,
  KURUL_GUNDEMINDE = 1190011
}

export const BASVURU_ASAMASI_LABELS: Readonly<Record<number, string>> = {
  [BasvuruAsamasi.YENI_BASVURU]: 'Yeni Başvuru',
  [BasvuruAsamasi.DUZELTME]: 'Düzeltme',
  [BasvuruAsamasi.KURULA_GONDERILDI]: 'Kurula Gönderildi',
  [BasvuruAsamasi.TESLIM_ALINDI]: 'Dosya Teslim Alındı',
  [BasvuruAsamasi.RAPORTORE_YONLENDIRILDI]: 'Raportöre Yönlendirildi',
  [BasvuruAsamasi.RAPOR_HAZIRLANDI]: 'Rapor Hazırlandı',
  [BasvuruAsamasi.UYGUN]: 'Uygun',
  [BasvuruAsamasi.UYGUN_DEGIL]: 'Uygun Değil',
  [BasvuruAsamasi.GOREVSIZLIK]: 'Görevsizlik',
  [BasvuruAsamasi.SILINDI]: 'Silindi',
  [BasvuruAsamasi.KURUL_GUNDEMINDE]: 'Kurul Gündeminde',
};

export function basvuruAsamaLabeli(asamaKid?: number | null): string {
  if (!asamaKid) {
    return '—';
  }

  return BASVURU_ASAMASI_LABELS[asamaKid] || `Aşama #${asamaKid}`;
}

/**
 * Değerlendirme durumları (DEGERLENDIRME_DURUMU)
 * Backend etikkurul.common/DTO/Enums/AppEnums.cs ile senkronize tutulmalı.
 */
export enum DegerlendirmeDurumu {
  HAZIRLIK = 2130001,
  TAMAMLANDI = 2130002,
}

export const DEGERLENDIRME_DURUMU_LABELS: Readonly<Record<number, string>> = {
  [DegerlendirmeDurumu.HAZIRLIK]: 'Hazırlık',
  [DegerlendirmeDurumu.TAMAMLANDI]: 'Tamamlandı',
};

export function degerlendirmeDurumLabeli(durumKid?: number | null): string {
  if (!durumKid) {
    return '—';
  }

  return DEGERLENDIRME_DURUMU_LABELS[durumKid] || `Durum #${durumKid}`;
}

/**
 * Aşamaya göre badge/etiket rengi.
 * web/CLAUDE.md "Başvuru Durum Renklendirmesi" tablosu ile uyumlu.
 *   - Yeni Başvuru (form eksik) -> kırmızı
 *   - Düzeltme (form %100 dolu, henüz gönderilmemiş) -> yeşil
 *   - Kurula Gönderildi -> sarı
 *   - Teslim Alındı / Uygun -> yeşil
 */
export function basvuruAsamaRengi(asamaKid?: number): 'red' | 'yellow' | 'green' | 'gray' {
  switch (asamaKid) {
    case BasvuruAsamasi.YENI_BASVURU:
      return 'red';
    case BasvuruAsamasi.DUZELTME:
      return 'green';
    case BasvuruAsamasi.KURULA_GONDERILDI:
      return 'yellow';
    case BasvuruAsamasi.TESLIM_ALINDI:
    case BasvuruAsamasi.UYGUN:
      return 'green';
    default:
      return 'gray';
  }
}
