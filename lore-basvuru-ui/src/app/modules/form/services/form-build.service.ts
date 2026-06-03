import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../base/services/http.service';
import { ServiceResponseModel } from '../../../base/models/general/service-response.model';

export interface FormKaydetReqDTO {
    ad?: string;
    aciklama?: string;
    eid?: string;
}

@Injectable({ providedIn: 'root' })
export class FormBuildService {

    constructor(private readonly http: HttpService) {}

    /**
     * Yeni form oluştur veya mevcut formu güncelle.
     * POST api/FormBuild/FormKaydet
     */
    FormKaydet(dto: FormKaydetReqDTO): Observable<ServiceResponseModel> {
        return this.http.Post('FormBuild/FormKaydet', dto);
    }

    /**
     * Formu yayınla.
     * POST api/FormBuild/FormYayinla?eid={eid}
     */
    FormYayinla(eid: string): Observable<ServiceResponseModel> {
        return this.http.Post(`FormBuild/FormYayinla?eid=${eid}`, {});
    }

    /**
     * Formu sil.
     * DELETE api/FormBuild/FormSil?eid={eid}
     */
    FormSil(eid: string): Observable<ServiceResponseModel> {
        return this.http.Delete(`FormBuild/FormSil?eid=${eid}`);
    }

    /**
     * Formu kopyala.
     * POST api/FormBuild/FormKopyala?eid={eid}
     */
    FormKopyala(eid: string): Observable<ServiceResponseModel> {
        return this.http.Post(`FormBuild/FormKopyala?eid=${eid}`, {});
    }
}
