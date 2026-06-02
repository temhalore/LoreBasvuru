// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

import { tap } from 'rxjs/operators';
import { Injectable } from "@angular/core";
import tab from "bootstrap/js/dist/tab";

@Injectable()
export class HelperService {
 
  constructor() {
  }
  static isNullOrEmpty(request:any) {
    if (request == null || request == undefined || request == '') {
      return true;
    }
    return false;
  }
}