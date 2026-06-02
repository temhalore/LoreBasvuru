import { BaseModel } from 'app/base/models/general/base.model';
import { KisiModel } from 'app/base/models/security/user/kisi.model';
import { KodModel } from 'app/base/models/common/kod.model';
import { EtikKurulModel } from 'app/base/models/definition-operations/etik-kurul.model';

export class GorevDashboardBasvuruModel extends BaseModel {
    basvuruTarihi: string | null = null;
    aktifAsamaKodDto: KodModel | null = null;
    etikKurulDto: EtikKurulModel | null = null;
    basvuruNo: string = '';
    basvuranAdSoyad: string = '';
}

export class GorevUserModel extends BaseModel {
    gorevliUserDto: KisiModel | null = null;
    rolKodDto: KodModel | null = null;
    isGorevGoruntulendi: boolean = false;
    gorevGorulmeTarihi: string | null = null;
    goreveAtamaAsamaKodDto: KodModel | null = null;
    gorevTarih: string | null = null;
    aciklama: string = '';
    basvuruDto: GorevDashboardBasvuruModel | null = null;
}
