import { KodModel } from '../../common/kod.model';
import { EidModel } from '../../general/eid.model';

/**
 * Kural Model'e göre seçilebilir Kural Tipleri ve alan zorunluluklarını döner
 */
export class KuralTipMapperModel {
  /**
   * DTO Model adı (örn: "RegexKontrolKuralDto", "YonlendirmeKuralDto")
   * Frontend hangi modeli kullanacağını buradan anlar
   */
  DtoModelAdi: string;

  /**
   * Bu Kural Model için seçilebilir Kural Tip listesi
   */
  SecilebilirKuralTipleri: KodModel[] | null;

  /**
   * Form seçimi zorunlu mu?
   */
  FormSecimZorunlu: boolean;

  /**
   * Soru seçimi zorunlu mu?
   */
  SoruSecimZorunlu: boolean;

  /**
   * Sayfa seçimi gösterilsin mi?
   */
  SayfaSecimGoster: boolean;

  /**
   * Bu Kural Model Yönlendirme mi?
   * true ise YonlendirmeFormComponent kullanılır
   * false ise DynamicKuralFormComponent kullanılır
   */
  IsYonlendirme: boolean;
}

/**
 * Request Model
 */
export class ReqKuralTipMapperModel {
  KuralModelKodDto: KodModel;
  FormKokEidDto?: EidModel;
  SoruTipKodDto?: KodModel;
}
