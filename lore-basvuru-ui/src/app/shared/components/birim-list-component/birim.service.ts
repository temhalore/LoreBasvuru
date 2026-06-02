import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpService } from '../../../base/services/http.service';
import { ServiceResponseModel } from '../../../base/models/general/service-response.model';
import { UnitModel } from '../../../base/models/mobile-permission/role-filter/unit.model';

@Injectable({
  providedIn: 'root'
})
export class BirimService {
  private readonly BIRIM_TREE_LIST_URL = 'Birim/GetBirimTreeListDto';

  constructor(private readonly httpService: HttpService) {}

  getBirimTreeList(request: UnitModel | null = null): Observable<UnitModel[]> {
    return this.httpService.Post<UnitModel[]>("Birim/GetBirimTreeListDto", request ?? {}).pipe(
      map((response: ServiceResponseModel) => {
        if (response?.isSuccess) {
          return (response.data as UnitModel[]) ?? [];
        }
        return [];
      })
    );
  }
}
