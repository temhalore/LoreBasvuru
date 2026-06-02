import { EidModel } from '../../general/eid.model';
import { KuralKosulV2Model } from './kural-kosul-v2.model';

/**
 * V2 kural JSON payload modeli.
 * Backend KuralV2JsonDto ile birebir eslesir.
 * t_form_kural_json.JsonMetni alanina serialize/deserialize edilir.
 */
export class KuralV2JsonModel {
  kosullar: KuralKosulV2Model[];
  hedefSayfaEIdDto: EidModel | null;
  hedefSoruKokEIdDto: EidModel | null;
  hataMesaji: string;
  isZorunlu: boolean;

  constructor() {
    this.kosullar = [];
    this.hedefSayfaEIdDto = null;
    this.hedefSoruKokEIdDto = null;
    this.hataMesaji = '';
    this.isZorunlu = false;
  }
}
