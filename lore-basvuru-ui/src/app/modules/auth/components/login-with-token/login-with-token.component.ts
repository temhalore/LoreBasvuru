import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../base/services/auth.service';
import { LoginResponseModel } from '../../../../base/models/security/auth/login-response.model';

@Component({
  selector: 'app-login-with-token',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-with-token.component.html',
  styleUrls: ['./login-with-token.component.scss']
})
export class LoginWithTokenComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = [];
  mesaj = 'Giris islemi yapiliyor...';
  hata = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    const tenantKod = this.route.snapshot.queryParamMap.get('tenant') ?? '';

    if (!token) {
      this.mesaj = 'Token bulunamadi.';
      this.hata = true;
      return;
    }

    const sub = this.authService.LoginWithToken(token, tenantKod).subscribe({
      next: (res: LoginResponseModel) => {
        if (res?.kisiTokenDto?.isLogin) {
          this.router.navigate(['/dashboard']);
        } else {
          this.mesaj = 'Giris basarisiz. Lutfen tekrar deneyin.';
          this.hata = true;
          setTimeout(() => this.router.navigate(['/auth/giris']), 3000);
        }
      },
      error: () => {
        this.mesaj = 'Bir hata olustu.';
        this.hata = true;
        setTimeout(() => this.router.navigate(['/auth/giris']), 2000);
      }
    });
    this.subs.push(sub);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/giris']);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
