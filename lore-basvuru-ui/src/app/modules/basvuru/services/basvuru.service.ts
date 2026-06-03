import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../base/services/http.service';
import { ServiceResponseModel } from '../../../base/models/general/service-response.model';
import { CevapKaydetReqDTO } from '../models/basvuru.model';

@Injectable({ providedIn: 'root' })
export class BasvuruService {
  constructor(private http: HttpService) {}

  /**
   * Kullanıcının başvurularını listele
   * GET api/FormRespondent/BasvurularimListele
   */
  Listele(): Observable<ServiceResponseModel> {
    return this.http.Get('FormRespondent/BasvurularimListele');
  }

  /**
   * Başvuru detayı
   * GET api/FormRespondent/BasvuruDetayGetir?basvuruEid={eid}
   */
  Getir(basvuruEid: string): Observable<ServiceResponseModel> {
    return this.http.Get(`FormRespondent/BasvuruDetayGetir?basvuruEid=${basvuruEid}`);
  }

  /**
   * Forma yeni başvuru başlat
   * POST api/FormRespondent/BasvuruBaslat?formEid={eid}
   */
  BasvuruBaslat(formEid: string): Observable<ServiceResponseModel> {
    return this.http.Post(`FormRespondent/BasvuruBaslat?formEid=${formEid}`, {});
  }

  /**
   * Sayfa cevaplarını kaydet
   * POST api/FormRespondent/CevapKaydet
   */
  CevapKaydet(req: CevapKaydetReqDTO): Observable<ServiceResponseModel> {
    return this.http.Post('FormRespondent/CevapKaydet', req);
  }

  /**
   * Başvuruyu tamamla
   * POST api/FormRespondent/BasvuruTamamla?basvuruEid={eid}
   */
  BasvuruTamamla(basvuruEid: string): Observable<ServiceResponseModel> {
    return this.http.Post(`FormRespondent/BasvuruTamamla?basvuruEid=${basvuruEid}`, {});
  }

  /**
   * Önceki başvurudan cevapları kopyala
   * POST api/FormRespondent/OncekiBasvurudanKopyala
   */
  OncekiBasvurudanKopyala(basvuruEid: string, kaynakBasvuruEid: string): Observable<ServiceResponseModel> {
    return this.http.Post('FormRespondent/OncekiBasvurudanKopyala', { basvuruEid, kaynakBasvuruEid });
  }

  /**
   * Aktif form listesi — FormBuild üzerinden
   * GET api/FormBuild/FormListesiGetir
   */
  AktifFormListesiGetir(pageNumber = 1, pageSize = 50): Observable<ServiceResponseModel> {
    return this.http.Get(`FormBuild/FormListesiGetir?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }
}
