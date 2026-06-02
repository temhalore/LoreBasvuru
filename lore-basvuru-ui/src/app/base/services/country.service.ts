// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from './http.service';
import { ServiceResponseModel } from '../models/general/service-response.model';
import { CountryModel } from '../models/common/country.model';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private readonly httpService: HttpService) {}

  getCountryList(): Observable<CountryModel[]> {
    return this.httpService.Post('Common/Country/GetList', {}).pipe(
      map((res: ServiceResponseModel) => res.data as CountryModel[])
    );
  }
}
