import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../base/services/auth.service';
import { LoginResponseModel } from '../../../../base/models/security/auth/login-response.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  showPassword = false;
  hatamesaji = '';
  yukleniyor = false;
  private subs: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // tenantKod query param'dan al (örn: ?tenant=firma-kod)
    const tenantKod = this.route.snapshot.queryParamMap.get('tenant') ?? '';

    this.loginForm = this.fb.group({
      kullaniciAdi: ['', [Validators.required]],
      sifre: ['', [Validators.required, Validators.minLength(4)]],
      tenantKod: [tenantKod],
    });
  }

  get f() { return this.loginForm.controls; }

  girisYap(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.hatamesaji = '';
    this.yukleniyor = true;

    const sub = this.authService.Login(
      this.f['kullaniciAdi'].value,
      this.f['sifre'].value,
      this.f['tenantKod'].value
    ).subscribe({
      next: (res: LoginResponseModel) => {
        this.yukleniyor = false;
        if (res?.kisiTokenDto?.isLogin) {
          this.router.navigate(['/dashboard']);
        } else {
          this.hatamesaji = 'Kullanıcı adı veya şifre hatalı.';
        }
      },
      error: () => {
        this.yukleniyor = false;
        this.hatamesaji = 'Sunucuya bağlanılamadı.';
      }
    });
    this.subs.push(sub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
