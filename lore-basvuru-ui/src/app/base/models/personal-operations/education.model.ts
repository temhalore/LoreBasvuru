import { BaseModel } from "../general/base.model";
import { KisiModel } from "../security/user/kisi.model";
import { KodDTO } from "./kod-dto.model";

export class EducationModel extends BaseModel {
  userDto: KisiModel | null = null;
  tckno: number = 0;
  adi: string = "";
  soyadi: string = "";

  // Kurum ve Bölüm Bilgileri
  universiteId: number = 0;
  universiteAdi: string = "";
  birimId: number = 0;
  birimAdi: string = "";
  programId: number = 0;
  programAdi: string = "";

  // Akademik Detaylar
  egitimTuru: string | null = null;
  programTuru: string | null = null;
  diplomaNotu: number | null = null;
  diplomaNotSistemi: number | null = null;
  diplomaNo: string | null = null;

  // Tarih Bilgileri
  kayitTarihi: Date | string | null = null;
  mezuniyetTarihi: Date | string | null = null;
  ayrilmaTarihi: Date | string | null = null;

  // Durum Bilgileri
  durum: string | null = null;
  sinif: string | null = null;
  ogrencilikHakkiVarMi: boolean = false;

  // Kaynak Bilgileri
  veriKaynagi: "MezunServisi" | "OgrenciServisi" | string = "";
  sourceTypeCodeDTO: KodDTO | null = null;
  isUsedInApplication: boolean = false;

  constructor(init?: Partial<EducationModel>) {
    super();
    Object.assign(this, init);
  }
}