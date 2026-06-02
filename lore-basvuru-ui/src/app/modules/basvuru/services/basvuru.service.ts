import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../base/services/http.service';
import { ServiceResponseModel } from '../../../base/models/general/service-response.model';
import { BasvuruListeFiltresi } from '../models/basvuru.model';

@Injectable({ providedIn: 'root' })
export class BasvuruService {
  constructor(private http: HttpService) {}

  /** Kullanıcının başvurularını listele */
  Listele(filtre: BasvuruListeFiltresi): Observable<ServiceResponseModel> {
    return this.http.Post('UserBasvuru/Listele', filtre);
  }

  /** Başvuru detayı */
  Getir(eid: string): Observable<ServiceResponseModel> {
    return this.http.Post('UserBasvuru/Getir', { eid });
  }

  /** Yeni başvuru oluştur */
  Olustur(basvuruFormEid: string): Observable<ServiceResponseModel> {
    return this.http.Post('UserBasvuru/Olustur', { basvuruFormEid });
  }

  /** Başvuruyu gönder */
  Gonder(eid: string): Observable<ServiceResponseModel> {
    return this.http.Post('UserBasvuru/Gonder', { eid });
  }

  /** Aktif form listesi */
  FormListesiGetir(): Observable<ServiceResponseModel> {
    return this.http.Post('BasvuruForm/AktifListele', {});
  }
}
