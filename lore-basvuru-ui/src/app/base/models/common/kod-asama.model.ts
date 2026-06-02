import { KodModel } from './kod.model';
import { RoleModel } from '../security/role/role.model';

export class KodAsamaModel {
    id: number;
    asamaKID: string;
    gecilebilirKIDList: string;
    yetkiliRoleEIDList: string;
    buttonIdList: string;
    isAktif: boolean;

    // Cozumlenmis KodDTO nesneleri (backendden geliyor)
    mevcutDurumKod: KodModel;
    gecilebilirKodList: KodModel[];
    yetkiliRoleList: RoleModel[];
    buttonListDto: KodModel[];

    // DataTable gosterim icin cozumlenmis isimler
    gecilebilirKodAdlari: string;
    yetkiliRolAdlari: string;
    buttonAdlari: string;
}

export class KodAsamaSaveModel {
    id: number = 0;
    asamaKID: string = '';
    gecilebilirKIDList: string = '';
    yetkiliRoleEIDList: string = '';
    buttonIdList: string = '';
    isAktif: boolean = true;
}
