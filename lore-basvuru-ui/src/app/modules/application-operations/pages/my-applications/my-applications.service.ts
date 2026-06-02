import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
// STUB - LoreBaşvuru'da kendi basvuru modülü kullanılacak
@Injectable({ providedIn: 'root' })
export class MyApplicationService {
  DownloadPdf(req?: any): Observable<any> { return of(null); }
  GetList(req?: any): Observable<any> { return of({ isSuccess: true, data: [] }); }
}
