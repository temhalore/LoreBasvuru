import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { first, retry, take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginResponseModel } from '../../../../base/models/security/auth/login-response.model';
import { AuthService } from '../../../../base/services/auth.service';
import { LoginWithSSORequestModel } from '../../../../base/models/security/auth/login-with.sso.request.model';
import { environment } from '../../../../../environments/environment';
import { KisiTokenModel } from '../../../../base/models/security/auth/kisi-token.model';

@Component({
  selector: 'app-login-with-token',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login-with-token.component.html',
  styleUrls: ['./login-with-token.component.scss']
})
export class LoginWithTokenComponent implements OnInit, OnDestroy {
  isLoading$: Observable<boolean>;
  public loginWithSSORequestDto$: BehaviorSubject<LoginWithSSORequestModel> = new BehaviorSubject<LoginWithSSORequestModel>(new LoginWithSSORequestModel());
  public loginData: BehaviorSubject<LoginResponseModel> = new BehaviorSubject<LoginResponseModel>(new LoginResponseModel());
  private unsubscribe: Subscription[] = [];

  // Dogrulama state
  isVerificationRequired = false;
  isEmailVerified = false;
  isPhoneVerified = false;
  redirectCountdown = 5;
  private countdownInterval: any;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    //
    this.isLoading$ = this.authService.isLoading$;

    // URL parametrelerini al
    const sbParams = this.route.queryParams.subscribe(params => {
      this.loginWithSSORequestDto$.getValue().ssoToken = params['ssoToken'];
      this.loginWithSSORequestDto$.getValue().statu = params['statuId'] as number;
      this.loginWithSSORequestDto$.getValue().tip = params['tipId'] as number;
      this.loginWithSSORequestDto$.getValue().token = params['token'];
      this.loginWithSSORequestDto$.getValue().loginName = "";
    });

    this.unsubscribe.push(sbParams);
  }

  ngOnInit(): void {
    this.loginWithToken();
  }

  loginWithToken(): void {

    const sbLoginWithToken = this.authService.LoginWithToken(this.loginWithSSORequestDto$.getValue())
      .pipe(first())
      .subscribe({
        next: (res: LoginResponseModel) => {
          
          if (res.kisiTokenDto === undefined) {
            res = new LoginResponseModel();
            res.kisiTokenDto = new KisiTokenModel();
            res.kisiTokenDto.isLogin = false;
          }
          
          this.loginData.next(res);

          if (res.kisiTokenDto.isLogin) {

            // Dogrulama kontrolu
            if (res.isDogrulamaGerekli) {
              this.isVerificationRequired = true;
              this.isEmailVerified = res.isEmailDogrulandi;
              this.isPhoneVerified = res.isCepTelDogrulandi;
              this.startCountdown();
            } else {
              // Basarili giris - dashboard'a yonlendir
              this.router.navigate(["/"]);
            }
          } else {
            // Başarısız giriş - 4 saniye sonra logout yap
            setTimeout(() => {
              this.authService.Logout();
            }, 4000);
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          setTimeout(() => {
            this.authService.Logout();
          }, 2000);
        }
      });
      
    this.unsubscribe.push(sbLoginWithToken);
  }

  goToLogin(): void {
    window.location.href = `${environment.loginUrl}`;
  }

  goToVerification(): void {
    window.location.href = `${environment.loginUrl}`;
  }

  private startCountdown(): void {
    this.redirectCountdown = 5;
    this.countdownInterval = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        clearInterval(this.countdownInterval);
        this.goToVerification();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
