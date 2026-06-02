import { Router } from '@angular/router';
import { Base64 } from 'js-base64';
import { LoginResponseModel } from '../models/security/auth/login-response.model';
import { environment } from 'environments/environment';

export class LocalStorageService {

  constructor(
  ) { }

  private static authLocalStorageToken: string = `${environment.appVersion}-${environment.userDataKey}`;
  private static selectedEtikKurulToken: string = `${environment.appVersion}-selectedEtikKurulEid`;
  private static selectedLayoutToken: string = `${environment.appVersion}-selectedLayout`;
  private static selectedSchemeToken: string = `${environment.appVersion}-selectedScheme`;
  private static selectedThemeToken: string = `${environment.appVersion}-selectedTheme`;

  //Şifreli LocalStorage Itemini Getirir, null ise '' olarak döner
  static getEncodedLocalStorageString(): string {
    let data = localStorage.getItem(this.authLocalStorageToken);
    if (data !== null) {
      return data;
    }
    else {
      return '';
    }
  }
  static getDecodedLocalStorageString(): string {
    let data = Base64.decode(this.getEncodedLocalStorageString());
    return data;
  }
  static getDecodedLocalStorageObject(): LoginResponseModel {
    let decodedLocalStorageString = this.getDecodedLocalStorageString();
    if (decodedLocalStorageString === "") {
      decodedLocalStorageString = "{}";
    }
    var data = JSON.parse(decodedLocalStorageString)
    return data;
  }
  ///////////////////////
  static setEncodedLocalStorageItem(jsonObject: LoginResponseModel) {

    var encodedJsonString = Base64.encode(JSON.stringify(jsonObject));

    localStorage.removeItem(this.authLocalStorageToken);
    localStorage.setItem(this.authLocalStorageToken, encodedJsonString);
  }
  static delEncodedLocalStorageItem() {
    localStorage.removeItem(this.authLocalStorageToken);
  }

  static getSelectedEtikKurulEid(): string {
    return localStorage.getItem(this.selectedEtikKurulToken) ?? '';
  }

  static setSelectedEtikKurulEid(eid: string): void {
    if (!eid) {
      localStorage.removeItem(this.selectedEtikKurulToken);
      return;
    }

    localStorage.setItem(this.selectedEtikKurulToken, eid);
  }

  static getSelectedLayout(): string {
    return localStorage.getItem(this.selectedLayoutToken) ?? '';
  }

  static setSelectedLayout(layout: string): void {
    if (!layout) {
      localStorage.removeItem(this.selectedLayoutToken);
      return;
    }
    localStorage.setItem(this.selectedLayoutToken, layout);
  }

  static getSelectedScheme(): string {
    return localStorage.getItem(this.selectedSchemeToken) ?? '';
  }

  static setSelectedScheme(scheme: string): void {
    if (!scheme) {
      localStorage.removeItem(this.selectedSchemeToken);
      return;
    }
    localStorage.setItem(this.selectedSchemeToken, scheme);
  }

  static getSelectedTheme(): string {
    return localStorage.getItem(this.selectedThemeToken) ?? '';
  }

  static setSelectedTheme(theme: string): void {
    if (!theme) {
      localStorage.removeItem(this.selectedThemeToken);
      return;
    }
    localStorage.setItem(this.selectedThemeToken, theme);
  }
}
