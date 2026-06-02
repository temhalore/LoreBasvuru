import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { ServiceResponseModel } from 'app/base/models/general/service-response.model';
import { PermissionModel } from 'app/base/models/security/permission/permission.model';
import { HttpService } from 'app/base/services/http.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
    isLoading$: Observable<boolean>;
    isLoadingSubject: BehaviorSubject<boolean>;

    constructor(
        private readonly httpService: HttpService,
    ) {
        this.isLoadingSubject = new BehaviorSubject<boolean>(false);
        this.isLoading$ = this.isLoadingSubject.asObservable();

    }

    GetList(): Observable<PermissionModel[]> {
        this.isLoadingSubject.next(true);

        return this.httpService.Post('security/permission/getlist', null).pipe(
            switchMap((res: ServiceResponseModel) => {
                return of((res.data as PermissionModel[]))
            }),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
    Check(): Observable<boolean> {
        this.isLoadingSubject.next(true);
        return this.httpService.Post('security/permission/check', null).pipe(
            switchMap((res: ServiceResponseModel) => {
                return of((res.data as boolean))
            }),
            finalize(() => this.isLoadingSubject.next(false))
        );
    }
}
