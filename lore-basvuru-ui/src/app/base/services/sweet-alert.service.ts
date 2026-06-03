import { tap } from 'rxjs/operators';
import { Injectable } from "@angular/core";
// import tab from "bootstrap/js/dist/tab";
import { BehaviorSubject, from, interval, Observable, of } from "rxjs";
import Swal from "sweetalert2"
import { ServiceResponseModel } from '../models/general/service-response.model';
import { HttpService } from './http.service';

@Injectable({ providedIn: 'root' })
export class SweetAlertService {
  // result$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  // confirmEmitter: EventEmitter<boolean> = new EventEmitter();
  result$: BehaviorSubject<ServiceResponseModel> = new BehaviorSubject<ServiceResponseModel>(new ServiceResponseModel);
  constructor(private httpService: HttpService) {
  }
  showMessage(
    type: string,
    message: string
  ) {
    Swal.fire({
      icon: type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'question',
      title: type === 'error' ? 'Hata' : type === 'success' ? 'Başarılı' : type === 'warning' ? 'Uyarı' : type === 'info' ? 'Bilgi' : 'Soru',
      text: message,
      // footer: '<a href="">Why do I have this issue?</a>'
    })
  }

  showHtmlMessage(
    type: string,
    title: string,
    html: string
  ) {
    Swal.fire({
      icon: type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'question',
      title: title || (type === 'error' ? 'Hata' : type === 'success' ? 'Başarılı' : type === 'warning' ? 'Uyarı' : type === 'info' ? 'Bilgi' : 'Soru'),
      html: html,
    })
  }

  confirm(
    title: string,
    text: string,
    confirmButtonText: string = 'Onayla',
    denyButtonText: string = 'Vazgeç',
  ): Promise<boolean> {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText,
      denyButtonText,
      confirmButtonColor: '#d33',
      denyButtonColor: '#6b7280',
      allowOutsideClick: false,
    }).then((result) => result.isConfirmed);
  }

  showDelete<T>(
    name: string,
    model: T,
    action: string,
  ): Observable<ServiceResponseModel> {

    return from(Swal.fire({
      title: name + ' Silinecek?',
      text: "Silmek istiyor musunuz!",
      icon: 'warning',
      showConfirmButton: true,
      showDenyButton: true,
      // showCancelButton: true,
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#d33',
      // cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, sil!',
      denyButtonText: 'Hayır, silme!',
      allowOutsideClick: false,
      preConfirm: () => {

        Swal.update({
          showDenyButton: false,
          text: name + ' Siliniyor...',
        });
         Swal.showLoading();//Volkan

        return this.httpService.Post(action, model).pipe(tap(res => {

          this.result$.next(res);
        }))

      },
      preDeny: () => {
        this.result$.next(
          { data: false } as ServiceResponseModel
        );
      }

    }).then((result) => {

      if (result.isConfirmed) {
        if (!this.result$.value.isSuccess) {
          Swal.fire(
            'Hata!',
            name + ' Silinemedi.' + "<br>" + this.result$.value.error_message.message,
            'error'
          )
        }
        else {
          Swal.fire(
            'Silindi!',
            name + ' Silindi.',
            'success'
          )
        }
      }
      else if (result.isDenied) {
        Swal.fire(
          'Vazgeçtiniz!',
          'Kayıt Silinmedi.',
          'error'
        )
      }
      else if (result.isDismissed) {
        Swal.fire(
          'Vazgeçtiniz!',
          'Kayıt Silinmedi.',
          'success'
        )
      }
      else {
      };
      return this.result$.value;
    }))
  }
  /**
   * Backend DELETE endpoint için onaylı silme dialogu.
   * @param name - Dialog başlığında gösterilecek kayıt adı
   * @param queryUrl - Tam URL: örn. 'Yetki/EkranSil?eid=xyz'
   */
  showDeleteByQuery(name: string, queryUrl: string): Observable<ServiceResponseModel> {
    return from(Swal.fire({
      title: name + ' Silinecek?',
      text: 'Silmek istiyor musunuz!',
      icon: 'warning',
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#d33',
      confirmButtonText: 'Evet, sil!',
      denyButtonText: 'Hayır, silme!',
      allowOutsideClick: false,
      preConfirm: () => {
        Swal.update({ showDenyButton: false, text: name + ' Siliniyor...' });
        Swal.showLoading();
        return this.httpService.Delete(queryUrl).pipe(tap(res => {
          this.result$.next(res);
        }));
      },
      preDeny: () => {
        this.result$.next({ data: false } as ServiceResponseModel);
      },
    }).then((result) => {
      if (result.isConfirmed) {
        if (!this.result$.value.isSuccess) {
          Swal.fire('Hata!', name + ' Silinemedi.' + '<br>' + this.result$.value.error_message?.message, 'error');
        } else {
          Swal.fire('Silindi!', name + ' Silindi.', 'success');
        }
      } else if (result.isDenied || result.isDismissed) {
        Swal.fire('Vazgeçtiniz!', 'Kayıt Silinmedi.', 'info');
      }
      return this.result$.value;
    }));
  }

  showSave<T>(
    name: string,
    model: T,
    action: string,
    description: string,
  ): Observable<ServiceResponseModel> {

    return from(Swal.fire({
      title: name ,//+ ' Kaydedilecek?'
      text: "Kaydetmek istiyor musunuz!",
      icon: 'warning',
      showConfirmButton: true,
      showDenyButton: true,
      // showCancelButton: true,
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#d33',
      // cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, kaydet!',
      denyButtonText: 'Hayır, kaydetme!',
      allowOutsideClick: false,
      preConfirm: () => {
        Swal.update({
          showDenyButton: false,
          text: name + ' Kaydediliyor..',
        });
        Swal.showLoading();//Volkan

        return this.httpService.Post(action, model).pipe(tap(res => {

          this.result$.next(res);
        }))

      },

    }).then((result) => {

      if (result.isConfirmed) {

        const res = this.result$.value
        if (res.isSuccess) {
          Swal.fire(
            'Kaydedildi!',
            res.message,
            // name + ' Kaydedilemedi.'+"<br>"+this.result$.value.oysException.oysMessage,
            'success'
          )
        }
        // if (this.result$.value.hasOYSException) {
        //   Swal.fire(
        //     'Hata!',
        //     name + ' Kaydedilemedi.' + "<br>" + this.result$.value.oysException.oysMessage,
        //     'error'
        //   )
        // } else {
        //   Swal.fire(
        //     'Kaydedildi!',
        //     name + ' Kaydedildi.<br><br><b>' + description + '</b>',

        //     'success'
        //   )
        // }
      }
      else if (result.isDenied) {
        Swal.fire(
          'Vazgeçtiniz!',
          name + ' Kaydedilemedi.',
          'error'
        )

      }
      else if (result.isDismissed) {
        Swal.fire(
          'Vazgeçtiniz!',
          name + ' Kaydedilemedi.',
          'success'
        )
      }
      else {
      };

      return this.result$.value;
    }))
  }

  showGateRedirect(): void {
    Swal.fire({
      title: 'İÜ Giriş Tarafından Doğrulanmış Bilgi',
      html: `Bu bilgiler <b>İstanbul Üniversitesi Giriş Sistemi tarafından doğrulandığı için 
      yine aynı sistem üzerinden değiştirilebilir</b>. 
      Buradan <b>Kullanıcı İşlemleri</b> menüsü altında bulunan menüler aracılığı ile iletişim bilgilerinizi düzenleyebilir, 
      ardından yine aynı sistemde <b>Anasayfa</b>  menüsü ile açılan pencerede bulunan <b>Tüm Uygulamalarım</b> butonu ile gelen uygulama listenizden  <b>Etik Kurul Başvuru</b> 
      uygulamasına <b>Uygulamaya Git</b> butonuna basarak tekrar geri 
      gelebilirsiniz.
      <br><br>Ya da doğrudan tarayıcınıza
      <b>${window.location.origin} </b> adresini yazarak 
      giriş yapabilirsiniz.`,
      icon: 'info',
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#6c757d',
      confirmButtonText: 'Evet, yönlendir',
      denyButtonText: 'Hayır',
      allowOutsideClick: false,
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      Swal.fire({
        title: 'Yönlendiriliyor...',
        text: 'İÜ Giriş bağlanılıyor...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      this.httpService.Post('Security/User/GetGateRedirectUrl', {}).subscribe({
        next: (res) => {
          if (res.isSuccess && res.data?.url) {
            Swal.close();
            window.open(res.data.url, '_blank');
          } else {
            Swal.fire('Hata', res.data?.message || 'İÜ Giriş URL\'i alınamadı.', 'error');
          }
        },
        error: () => {
          Swal.fire('Hata', 'İÜ Giriş servisine ulaşılamadı.', 'error');
        },
      });
    });
  }

  showMissingList<T>(

    missingList: string[],
    missingText: string = "",

  ): Observable<boolean> {
    return from(Swal.fire({
      title: "Aşağıda yer alan alanlar boş olamaz",
      html: "<div>" + missingText + "</div>",
      icon: 'error',
      showConfirmButton: true,
      // showDenyButton: false,
      // showCancelButton: true,
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#d33',
      // cancelButtonColor: '#d33',
      confirmButtonText: 'Kapat',

      // denyButtonText: 'Hayır, silme!',
      //  : () => {
      //    Swal.update({
      //          ()=>

      //      html: missingText,
      //      text: name + ' Siliniyor...',
      //    });
      //  Swal.showLoading();
      // cancelButtonText: 'Vazgeç, silme!'

      // }
    }).then((result): boolean => {
      if (result.isConfirmed) {
        Swal.fire(
          'Bilgi!',
          'Eksik alanları tamamlayarak yeniden deneyiniz.',
          'success'
        )
        return true
      }
      else if (result.isDenied) {
        Swal.fire(
          'Bilgi!',
          'Eksik alanları tamamlayarak yeniden deneyiniz.',
          'success'
        )
        return false

      }
      else if (result.isDismissed) {
        Swal.fire(
          'Vazgeçtiniz!',
          'Dosyanız Silinmedi.',
          'success'
        )
        return false
      }
      else {
        return false
      }
    })
    )
  }

}
  