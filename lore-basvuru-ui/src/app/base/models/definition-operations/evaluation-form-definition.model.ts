
import { KodModel } from "../common/kod.model";
import { BaseModel } from "../general/base.model";

export class EvaluationFormDefinitionModel extends BaseModel {
  degerlendimeTipKodDto: KodModel;
  etikKurulDto: {
    id?: number;
    eid?: string;
    name?: string;
  } | null;
  baslik: string;
  sira: number;
  isAktif: boolean;

  constructor() {
    super();
    this.degerlendimeTipKodDto = new KodModel();
    this.etikKurulDto = null;
    this.baslik = '';
    this.sira = 0;
    this.isAktif = true;
  }
}


