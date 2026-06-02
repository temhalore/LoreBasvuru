// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

export class VerifyCodeRequestModel {
  registrationEid: string;
  type: 'email' | 'phone';
  code: string;
}
