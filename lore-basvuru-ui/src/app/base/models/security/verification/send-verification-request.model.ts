// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

export class SendVerificationRequestModel {
  registrationEid: string;
  type: 'email' | 'phone';
  target: string;
}
