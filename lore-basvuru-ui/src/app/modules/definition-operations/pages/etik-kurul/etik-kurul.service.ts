import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
// STUB - LoreBaşvuru'da kullanılmıyor
@Injectable({ providedIn: 'root' })
export class EtikKurulService {
  Get(req?: any): Observable<any> { return of({ isSuccess: true, data: [] }); }
  GetList(req?: any): Observable<any> { return of({ isSuccess: true, data: [] }); }
}
