import { EidModel } from '../../general/eid.model';
import { ReqKuralV2Model } from './kural-v2.model';

/**
 * V2 kuralları tek transaction'da toplu upsert + sil request modeli.
 * Backend KuralV2TopluKaydetReqDto ile birebir eşleşir.
 */
export class KuralV2TopluKaydetReqModel {
  formKokEIdDto: EidModel | null;
  /** Upsert edilecek kurallar. eid boş → insert, eid dolu → update. */
  kurallar: ReqKuralV2Model[];
  /** Soft-delete edilecek kuralların eid listesi. */
  silinecekKurallar: EidModel[];

  constructor() {
    this.formKokEIdDto = null;
    this.kurallar = [];
    this.silinecekKurallar = [];
  }
}
