/*
*
* TODO:
* Bu dosya tamamen yorum halinde ve hicbir yerde kullanilmiyor.
* Kaldirilacak!
*
*/
// import { Injectable, ViewChild } from '@angular/core';
// import { BehaviorSubject, Observable, Subject, Subscription, of, throwError } from 'rxjs';
// import { finalize, map, retry, switchMap, tap } from 'rxjs/operators';
// import { DataTableDirective } from 'angular-datatables';
// import { HttpService } from './http.service';
// import { DataTableResponseModel } from '../models/general/datatable-response.model';
// import { ServiceResponseModel } from '../models/general/service-response.model';

// declare let $: any
// @Injectable({
//   providedIn: 'root'
// })

// @Injectable({ providedIn: 'root' })
// export class DataTableService<T1, T2> {
//   dtOptions: DataTables.Settings = {};
//   private dtTrigger = new Subject<any>();
//   public search: string = '';
//   dropdownSettings = {};
//   isLoading$: Observable<boolean>;

//   isLoadingSubject: BehaviorSubject<boolean>;
//   dataTableDto$: BehaviorSubject<T2[]> = new BehaviorSubject<T2[]>([]);
//   isServerSide: boolean = true;
//   private pageChangeSubject = new BehaviorSubject<number>(0);
//   public pageChange$ = this.pageChangeSubject.asObservable();

//   get getDtTrigger() {
//     return this.dtTrigger;
//   }
//   resetDtTrigger() {
//     this.dtTrigger = new Subject<any>();
//     return this.dtTrigger;
//   }
//   resetDataTable() {
//     this.dataTableDto$.next([]);
//     this.resetDtTrigger();
//   }
//   constructor(private readonly httpService: HttpService,


//   ) {
//     this.isLoadingSubject = new BehaviorSubject<boolean>(false);
//     this.isLoading$ = this.isLoadingSubject.asObservable();
//   }
//   GetDataTableList(
//     requestModel: T1 | null,
//     apiUrl: string | null,
//     dtColumns: any,
//     dtOrder: any = [[0, 'desc']],
//     selectedItems: any[] = []
//   ) {
//     this.resetDataTable();

//     this.isServerSide = true;
//     // 
//     // if (this.isServerSide) {
//     this.setupServerSideDataTable(requestModel!, apiUrl!, dtColumns, dtOrder, selectedItems);
//     // } else {
//     //   this.setupFrontEndDataTable(dtColumns, dtOrder);
//     // }
//     this.setupDropdownSettings();

//   }
//   private setupServerSideDataTable(
//     requestModel: T1,
//     apiUrl: string,
//     dtColumns: any,
//     dtOrder: any,
//     selectedItems: any[]
//   ) {
//     this.dtOptions = {
//       pagingType: 'full_numbers',
//       serverSide: true,
//       processing: true,
//       searching: false,
//       language: {
//         url: 'assets/i18n/datatable.tr.json',
//       },
//       ajax: (dataTablesParameters: any, callback) => {

//         dataTablesParameters.data = requestModel;
//         if (this.search != '') dataTablesParameters.search.value = this.search;
        
//         this.GetDataTableListRequest(dataTablesParameters, apiUrl).subscribe((res) => {

//           // callback({
//           // draw: dataTablesParameters.draw,
//           // recordsTotal: res.recordsTotal,
//           // recordsFiltered: res.recordsFiltered,
//           // data: isDt ? res.data : [],
//           callback({
//             draw: dataTablesParameters.draw,
//             recordsTotal: res.recordsTotal,
//             recordsFiltered: res.recordsFiltered,
//             // data:  res.data,

//           });
//           if (res.data != null && res.data != undefined) {
//             res.data.forEach((item) => {
              
//               const firstColumn = Object.keys(item)[0]; // İlk kolonun anahtarını al
//               item.isSelected = !!selectedItems.find((selected) => selected[firstColumn] === item[firstColumn]);
//             });
//             this.dataTableDto$.next(res.data);
//           }
//         });
//       },
//       order: dtOrder,
//       columns: dtColumns,
//       dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
//         "<'row'<'col-sm-12'tr>>" +
//         "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
//     };

//   }


//   GetDataTableListRequest(request: any, apiUrl: string): Observable<DataTableResponseModel> {

//     this.isLoadingSubject.next(true);

//     return this.httpService.Post(apiUrl, request).pipe(
//       switchMap((res: ServiceResponseModel) => {
//         return of((res.data as DataTableResponseModel))
//       }),
//       finalize(() => this.isLoadingSubject.next(false))
//     );
//   }

//   private setupDropdownSettings() {
//     this.dropdownSettings = {
//       singleSelection: false,
//       idField: 'eid',
//       textField: 'ad',
//       selectAllText: 'Tümünü Seç',
//       unSelectAllText: 'Tüm Seçimi Kaldır',
//       searchPlaceholderText: 'Ara',
//       itemsShowLimit: 2,
//       allowSearchFilter: true,
//       fixedColumns: {
//         left: 1,
//         right: 1
//       }
//     };
//   }

//   Renderer(dtElement: DataTableDirective) {
//     if (dtElement && dtElement.dtInstance) {
//       dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
//         // Tabloyu yeniden oluştur
//         dtInstance.destroy();
//         this.dtTrigger.next(undefined);
//       }).catch((error) => {
//         console.error('Tablo yüklenirken hata oluştu:', error);
//       });
//     } else {
//       console.error('Datatable henüz hazır değil!');
//     }
//   }
// }
