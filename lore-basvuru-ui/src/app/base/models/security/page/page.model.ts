import { BaseModel } from "../../general/base.model";

export class PageModel extends BaseModel {
  // Backend EkranDTO alanları (LoreBaşvuru)
  ad: string = '';       // ekran adı
  yol: string = '';      // route yolu (örn: /dashboard, /admin/roller)
  kod: string = '';      // ekran kodu
  ikon: string = '';
  ustEkranId: number;
  siraNo: number;
  aktifMi: boolean = true;
  altEkranlar: PageModel[] = [];

  // Geriye dönük uyumluluk — çift yönlü binding için setter'lar da var
  get name(): string { return this.ad; }
  set name(v: string) { this.ad = v; }

  get routerLink(): string { return this.yol; }
  set routerLink(v: string) { this.yol = v; }

  get ekranYolu(): string { return this.yol; }
  set ekranYolu(v: string) { this.yol = v; }

  get ekranAdi(): string { return this.ad; }
  set ekranAdi(v: string) { this.ad = v; }

  get ekranKodu(): string { return this.kod; }
  set ekranKodu(v: string) { this.kod = v; }

  menuTree: string;
  ustEkranEid: string;
  orderNo: number;
}

// LoreBaşvuru alias
export { PageModel as EkranModel };
