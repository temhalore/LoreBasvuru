/**
 * Şifreli ID taşıyıcısı — backend EidDTO ile birebir eşleşir.
 *
 * Kullanım:
 *  - Request göndermek:  { adimEid: { eid: "abc123" } }
 *  - Response okumak:    response.basvuruEid.eid  → "abc123"
 *
 * Frontend şifre çözme yapmaz; backend her zaman eid string döner.
 */
export interface EidDTO {
  eid?: string | null;
}

/** Kolaylık: string'den EidDTO üret */
export const toEidDTO = (eid: string | null | undefined): EidDTO => ({ eid: eid ?? undefined });

/** Kolaylık: EidDTO'dan eid string çıkar */
export const fromEidDTO = (dto: EidDTO | null | undefined): string => dto?.eid ?? '';
