import { KodModel } from "../common/kod.model";
import { EtikKurulModel } from "../definition-operations/etik-kurul.model";
import { BaseModel } from "../general/base.model";
import { EducationModel } from "../personal-operations/education.model";
import { KisiModel } from "../security/user/kisi.model";
import { GundemModel } from "../etik-kurul/gundem.model";

export class DegerlendirmeDetayModel extends BaseModel {
  id: number;
  degerlendirmeId: number;
  degerlendirmeTanimId: number | null;
  baslik: string;
  aciklama: string;
  sira: number;

  constructor() {
    super();
    this.id = 0;
    this.degerlendirmeId = 0;
    this.degerlendirmeTanimId = null;
    this.baslik = '';
    this.aciklama = '';
    this.sira = 0;
  }
}

export class DegerlendirmeVersionModel {
  degerlendirmeId: number;
  gundemBasligi: string | null;
  createdDate: string | null;
  createdUser: number | null;
  createdUserFullName: string | null;
  isAktif: boolean;
  degerlendirmeDurumKID: number | null;
  degerlendirmeBaslamaTarih: string | null;
  tamamlamaTarih: string | null;
  islemYapanUserId: number | null;
  islemYapanUserFullName: string | null;
  oncekiAsamaKID: number | null;
  yeniAsamaKID: number | null;
  detaylar: DegerlendirmeDetayModel[];

  constructor() {
    this.degerlendirmeId = 0;
    this.gundemBasligi = null;
    this.createdDate = null;
    this.createdUser = null;
    this.createdUserFullName = null;
    this.isAktif = false;
    this.degerlendirmeDurumKID = null;
    this.degerlendirmeBaslamaTarih = null;
    this.tamamlamaTarih = null;
    this.islemYapanUserId = null;
    this.islemYapanUserFullName = null;
    this.oncekiAsamaKID = null;
    this.yeniAsamaKID = null;
    this.detaylar = [];
  }
}

export class DegerlendirmeTimelineResponse {
  raportor: DegerlendirmeVersionModel[];
  gundemSonucu: DegerlendirmeVersionModel[];

  constructor() {
    this.raportor = [];
    this.gundemSonucu = [];
  }
}

export class ApplicationModel extends BaseModel {
  etikKurulDto: EtikKurulModel;
  userDto: KisiModel;
  reporterUserDto: KisiModel;
  dosyaTeslimAlanKisiDto: KisiModel | null;

  dosyaTeslimTarihi: string | null;
  etikKurulaGondermeTarihi: string | null;
  raportoreGondermeTarihi: string | null;
  raporHazirlanmaTarihi: string | null;
  userEducationDto: EducationModel;
  kullaniciFormDto: BaseModel | null;
  gundemDto: GundemModel | null;

  applicationStatusKodDto: KodModel;
  degerlendirmeDetayList: DegerlendirmeDetayModel[];
  ePostaIcerigi: string;
  aciklama: string;
  basvuruNo: string;

  /** Backend tarafından hesaplanan izinli buton ID listesi */
  allowedButtonIds: number[];

  constructor() {
    super();
    this.etikKurulDto = new EtikKurulModel();
    this.applicationStatusKodDto = new KodModel();
    this.degerlendirmeDetayList = [];
    this.reporterUserDto = new KisiModel();
    this.gundemDto = null;
    this.dosyaTeslimAlanKisiDto = null;
    this.dosyaTeslimTarihi = null;
    this.allowedButtonIds = [];
  }
}
