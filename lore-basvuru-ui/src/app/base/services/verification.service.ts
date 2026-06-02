import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import { ServiceResponseModel } from '../models/general/service-response.model';
import { SendVerificationRequestModel } from '../models/security/verification/send-verification-request.model';
import { VerifyCodeRequestModel } from '../models/security/verification/verify-code-request.model';
import { VerificationResponseModel } from '../models/security/verification/verification-response.model';

// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

@Injectable({ providedIn: 'root' })
export class VerificationService {
  constructor(private readonly httpService: HttpService) {}

  epostaKodGonder(request: SendVerificationRequestModel): Observable<VerificationResponseModel> {
    return this.httpService.Post('Security/Verification/EpostaKodGonder', request).pipe(
      map((res: ServiceResponseModel) => res.data as VerificationResponseModel)
    );
  }

  epostaDogrula(request: VerifyCodeRequestModel): Observable<VerificationResponseModel> {
    return this.httpService.Post('Security/Verification/EpostaDogrula', request).pipe(
      map((res: ServiceResponseModel) => res.data as VerificationResponseModel)
    );
  }

  telKodGonder(request: SendVerificationRequestModel): Observable<VerificationResponseModel> {
    return this.httpService.Post('Security/Verification/TelKodGonder', request).pipe(
      map((res: ServiceResponseModel) => res.data as VerificationResponseModel)
    );
  }

  telDogrula(request: VerifyCodeRequestModel): Observable<VerificationResponseModel> {
    return this.httpService.Post('Security/Verification/TelDogrula', request).pipe(
      map((res: ServiceResponseModel) => res.data as VerificationResponseModel)
    );
  }
}
