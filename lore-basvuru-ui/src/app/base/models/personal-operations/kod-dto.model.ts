export class KodDTO {
  id?: number;
  kod?: string;
  ad?: string;
  aciklama?: string;

  constructor(init?: Partial<KodDTO>) {
    Object.assign(this, init);
  }
}
