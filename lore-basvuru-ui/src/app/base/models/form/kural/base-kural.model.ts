import { BaseModel } from '../../general/base.model';
import { KodModel } from '../../common/kod.model';
import { EidModel } from '../../general/eid.model';

/**
 * Tüm kural tiplerinin ortak alanlarını içeren abstract base model
 * Backend BaseKuralDto ile birebir eşleşir
 */
export abstract class BaseKuralModel extends BaseModel {
  HataMesaji: string;
  IsZorunlu: boolean;

  constructor() {
    super();
    this.HataMesaji = '';
    this.IsZorunlu = false;
  }
}

/**
 * Response model - Backend ResKuralDto ile birebir eşleşir
 */
export class ResKuralModel extends BaseModel {
  FormKokEIdDto: EidModel | null;
  FormSoruKokEIdDto: EidModel | null;
  KuralModelKodDto: KodModel | null;
  KuralTipKodDto: KodModel | null;
  KuralDetayJson: string;
  Sira: number;
  IsAktif: boolean;
  CreatedDate: Date | null;
  ModifiedDate: Date | null;

  constructor() {
    super();
    this.FormKokEIdDto = null;
    this.FormSoruKokEIdDto = null;
    this.KuralModelKodDto = null;
    this.KuralTipKodDto = null;
    this.KuralDetayJson = '';
    this.Sira = 0;
    this.IsAktif = true;
    this.CreatedDate = null;
    this.ModifiedDate = null;
  }
}

/**
 * Request model - Backend ReqKuralDto ile birebir eşleşir
 */
export class ReqKuralModel extends BaseModel {
  FormKokEIdDto: EidModel | null;
  FormSoruKokEIdDto: EidModel | null;
  KuralModelKodDto: KodModel | null;
  KuralTipKodDto: KodModel | null;
  KuralDetayJson: string;
  Sira: number;
  IsAktif: boolean;

  constructor() {
    super();
    this.FormKokEIdDto = null;
    this.FormSoruKokEIdDto = null;
    this.KuralModelKodDto = null;
    this.KuralTipKodDto = null;
    this.KuralDetayJson = '';
    this.Sira = 0;
    this.IsAktif = true;
  }
}
