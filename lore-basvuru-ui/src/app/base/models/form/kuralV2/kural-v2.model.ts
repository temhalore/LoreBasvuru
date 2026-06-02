import { BaseModel } from '../../general/base.model';
import { EidModel } from '../../general/eid.model';
import { KodModel } from '../../common/kod.model';
import { KuralV2JsonModel } from './kural-v2-json.model';

/**
 * V2 kural request modeli.
 * Backend KuralV2ReqDto ile birebir eslesir.
 * t_form_kural tablosuna karsilik geldiginden BaseModel'den (eid) turetilir.
 */
export class ReqKuralV2Model extends BaseModel {
  formKokEIdDto: EidModel | null;
  formSoruKokEIdDto: EidModel | null;
  kuralTipKodDto: KodModel | null;
  kuralDetay: KuralV2JsonModel;
  sira: number;
  isAktif: boolean;

  constructor() {
    super();
    this.formKokEIdDto = null;
    this.formSoruKokEIdDto = null;
    this.kuralTipKodDto = null;
    this.kuralDetay = new KuralV2JsonModel();
    this.sira = 0;
    this.isAktif = true;
  }
}

/**
 * V2 kural response modeli.
 * Backend KuralV2ResDto ile birebir eslesir.
 */
export class ResKuralV2Model extends BaseModel {
  formKokEIdDto: EidModel | null;
  formSoruKokEIdDto: EidModel | null;
  kuralTipKodDto: KodModel | null;
  kuralDetay: KuralV2JsonModel | null;
  sira: number;
  isAktif: boolean;
  createdDate: Date | null;
  modifiedDate: Date | null;

  constructor() {
    super();
    this.formKokEIdDto = null;
    this.formSoruKokEIdDto = null;
    this.kuralTipKodDto = null;
    this.kuralDetay = null;
    this.sira = 0;
    this.isAktif = true;
    this.createdDate = null;
    this.modifiedDate = null;
  }
}
