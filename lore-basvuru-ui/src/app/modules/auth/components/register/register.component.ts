import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, OnInit, OnDestroy, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil, switchMap, EMPTY } from 'rxjs';

import { TextInputComponent } from 'app/shared/components/form-controls/text-input/text-input.component';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { DatepickerInputComponent } from 'app/shared/components/form-controls/datepicker-input/datepicker-input.component';
import { CheckboxInputComponent } from 'app/shared/components/form-controls/checkbox-input/checkbox-input.component';
import { PhoneInputComponent } from 'app/shared/components/form-controls/phone-input/phone-input.component';

import { UserRegistrationService } from 'app/base/services/user-registration.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';

import { DisarindanKisiRequestModel } from 'app/base/models/security/user/disarindan-kisi-request.model';

import { environment } from 'environments/environment';
import { CountryDefaults } from 'app/base/models/common/country-defaults.enum';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TextInputComponent,
    ApiSelectInputComponent,
    DatepickerInputComponent,
    CheckboxInputComponent,
    PhoneInputComponent,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [SweetAlertService],
})
export class RegisterComponent implements OnInit, OnDestroy {
  @ViewChild('stepper') stepper: MatStepper;

  private destroy$ = new Subject<void>();

  // Prod dışı ortamlarda kayıt ekranındaki bazı zorunluluklar gevşetilir.
  readonly testModu = false; // isDevMode();

  isLoading = false;
  registrationEid: string = '';
  registrationSuccess = false;
  registrationError = '';
  today = new Date();
  showPassword = false;
  showPasswordConfirm = false;

  // Step 1 - Bilgi Girişi
  infoForm = new FormGroup({
    uyruk: new FormControl(null, Validators.required),
    kimlikNo: new FormControl('', [Validators.required, Validators.minLength(11), Validators.maxLength(11), Validators.pattern(/^[0-9]{11}$/)]),
    dogumTarihi: new FormControl(null, Validators.required),
    ad: new FormControl('', [Validators.required, Validators.minLength(2)]),
    soyad: new FormControl('', [Validators.required, Validators.minLength(2)]),
    telefon: new FormControl('', [Validators.required, Validators.minLength(10)]),
    // Tekrar telefon alanı geçici olarak kaldırıldı. Geri ihtiyaç olursa eski akış buradan açılabilir.
    // telefonTekrar: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    // Tekrar e-posta alanı geçici olarak kaldırıldı. Geri ihtiyaç olursa eski akış buradan açılabilir.
    // emailTekrar: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    passwordConfirm: new FormControl('', [Validators.required]),
    bilgileriDogruluyorum: new FormControl(false, [Validators.requiredTrue]),
  }, { validators: RegisterComponent.formMatchValidators });

  constructor(
    private readonly userRegistrationService: UserRegistrationService,
    private readonly sweetAlertService: SweetAlertService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {
    // Uyruk değiştiğinde TC kimlik validasyonu ayarla
    this.infoForm.get('uyruk').valueChanges.pipe(takeUntil(this.destroy$)).subscribe((country: any) => {
      const kimlikNoControl = this.infoForm.get('kimlikNo');
      const isTurkey = !country || country?.code == CountryDefaults.TurkeyCode;
      if (isTurkey) {
        kimlikNoControl.setValidators([Validators.required, Validators.minLength(11), Validators.maxLength(11), Validators.pattern(/^[0-9]{11}$/)]);
      } else {
        kimlikNoControl.setValidators([Validators.required, Validators.minLength(5), Validators.maxLength(20)]);
      }
      kimlikNoControl.updateValueAndValidity();
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    if (this.testModu) {
      ['email', 'telefon', 'dogumTarihi'].forEach(field => {
        const ctrl = this.infoForm.get(field);
        ctrl?.removeValidators(Validators.required);
        ctrl?.updateValueAndValidity();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  static formMatchValidators(group: AbstractControl): ValidationErrors | null {
    const errors: ValidationErrors = {};

    const password = group.get('password')?.value;
    const passwordConfirm = group.get('passwordConfirm')?.value;
    if (password && passwordConfirm && password !== passwordConfirm) {
      errors.passwordMismatch = true;
    }

    // Tekrar email/telefon alanları geçici olarak kaldırıldığı için eşleştirme validasyonu kapatıldı.
    // const email = group.get('email')?.value;
    // const emailTekrar = group.get('emailTekrar')?.value;
    // if (email && emailTekrar && email !== emailTekrar) {
    //   errors.emailMismatch = true;
    // }

    // const telefon = group.get('telefon')?.value;
    // const telefonTekrar = group.get('telefonTekrar')?.value;
    // if (telefon && telefonTekrar && telefon !== telefonTekrar) {
    //   errors.telefonMismatch = true;
    // }

    return Object.keys(errors).length ? errors : null;
  }

  onCountryDataLoaded(countries: any[]): void {
    if (!this.infoForm.get('uyruk').value && countries?.length) {
      const turkey = countries.find(c => c.code == CountryDefaults.TurkeyCode);
      if (turkey) {
        this.infoForm.get('uyruk').setValue(turkey);
        this.cdr.detectChanges();
      }
    }
  }

  get isTurkeySelected(): boolean {
    const country = this.infoForm.get('uyruk')?.value;
    return !country || country?.code == CountryDefaults.TurkeyCode;
  }

  get kimlikNoLabel(): string {
    return this.isTurkeySelected ? 'Kimlik No' : 'Pasaport No';
  }

  get kimlikNoPlaceholder(): string {
    return this.isTurkeySelected ? 'Kimlik numaranızı giriniz' : 'Pasaport numaranızı giriniz';
  }

  get kimlikNoMaxLength(): number {
    return this.isTurkeySelected ? 11 : 20;
  }

  onKimlikNoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.isTurkeySelected) {
      input.value = input.value.replace(/\D/g, '').slice(0, 11);
    } else {
      input.value = input.value.slice(0, 20);
    }
    this.infoForm.get('kimlikNo').setValue(input.value, { emitEvent: false });
  }

  onPastePrevent(event: ClipboardEvent): void {
    event.preventDefault();
  }

  private getRawPhone(): string {
    const formatted = this.infoForm.get('telefon').value || '';
    return formatted.replace(/\s/g, '');
  }

  get passwordMismatch(): boolean {
    return this.infoForm.hasError('passwordMismatch') && this.infoForm.get('passwordConfirm').touched;
  }

  get emailMismatch(): boolean {
    return false;
  }

  get telefonMismatch(): boolean {
    return false;
  }

  // Kayıt ol: Tek çağrıda DB + SSO kayıt + IU Giriş URL alma
  onInfoSubmit(): void {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    const formValue = this.infoForm.value;

    const saveRequest = new DisarindanKisiRequestModel();
    saveRequest.ad = formValue.ad;
    saveRequest.soyad = formValue.soyad;
    saveRequest.email = formValue.email;
    saveRequest.telefon = this.getRawPhone();
    saveRequest.password = formValue.password;
    saveRequest.uyrukEid = formValue.uyruk?.eid || '';
    saveRequest.kimlikNo = formValue.kimlikNo;
    saveRequest.dogumTarihi = formValue.dogumTarihi ? new Date(formValue.dogumTarihi).toISOString() : '';

    // Önce parola kontrolü, başarılıysa kayıt
    this.userRegistrationService.checkParola(formValue.password, formValue.passwordConfirm).pipe(
      switchMap((checkRes) => {
        const checkData = checkRes.data;
        if (checkData?.isSuccess) {
          // Parola geçerli → kayıt işlemine devam
          return this.userRegistrationService.saveRevize(saveRequest);
        } else {
          // Parola geçersiz → hata mesajını göster, formda kal
          this.isLoading = false;
          this.sweetAlertService.showMessage('error', checkData?.message || 'Parola uygun değil.');
          this.cdr.markForCheck();
          return EMPTY;
        }
      }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (res) => {
        const data = res.data;
        if (res.isSuccess && data?.isSuccess) {
          this.registrationSuccess = true;
          this.stepper.next();
          this.isLoading = false;
          this.cdr.markForCheck();

          if (data.iuGirisUrl) {
            setTimeout(() => {
              window.location.href = data.iuGirisUrl;
            }, 2000);
          } else if (data.ssoToken) {
            setTimeout(() => {
              this.router.navigate(['/auth/login-with-sso'], {
                queryParams: { ssoToken: data.ssoToken },
              });
            }, 2000);
          } else {
            setTimeout(() => this.navigateToLogin(), 3000);
          }
        } else {
          this.registrationError = data?.message || res.message || 'Kayıt sırasında bir hata oluştu.';
          this.stepper.next();
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.sweetAlertService.showMessage('error', err?.message || 'Kayıt sırasında bir hata oluştu.');
        this.cdr.markForCheck();
      },
    });
  }

  retryRegistration(): void {
    this.registrationError = '';
    this.registrationSuccess = false;
    this.stepper.previous();
    this.cdr.markForCheck();
  }

  navigateToLogin(): void {
    window.location.href = environment.loginUrl;
  }
}
