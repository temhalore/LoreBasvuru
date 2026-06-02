import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import { ServiceResponseModel } from '../models/general/service-response.model';
import { DisarindanKisiRequestModel } from '../models/security/user/disarindan-kisi-request.model';

@Injectable({
  providedIn: 'root'
})
export class UserRegistrationService {

  constructor(private readonly httpService: HttpService) {}

  saveRevize(request: DisarindanKisiRequestModel): Observable<ServiceResponseModel> {
    return this.httpService.Post('Security/User/SaveRevize', request).pipe(
      map((res: ServiceResponseModel) => res)
    );
  }

  checkParola(parola: string, parolaTekrar: string): Observable<ServiceResponseModel> {
    return this.httpService.Post('Security/User/CheckParola', { parola, parolaTekrar }).pipe(
      map((res: ServiceResponseModel) => res)
    );
  }
}
