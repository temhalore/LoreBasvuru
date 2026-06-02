import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateFn
} from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { LoginResponseModel } from '../models/security/auth/login-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) { }

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {

    let currentUserValue: LoginResponseModel = this.authService.currentUserValue;
    if (!currentUserValue.kisiTokenDto?.isLogin) {
      this.authService.Logout();
      return false;
    } else {
      
      return true;
      // Şimdilik true dönüyor, diğer logic'i sonra aktif edebilirsin
      /*
      if (currentUserValue.pageListDto.length > 0) {
        const currentUrl = state.url;
        if (currentUrl) {
          const match = this.authService.checkPageAccess(currentUrl);
          if (match) {
            return true;
          } else {
            this.router.navigate(['/academy/data-table-example']);
            return false;
          }
        }
        else {
          this.router.navigate(['/academy/data-table-example']);
          return false;
        }
      }
      else {
        this.authService.Logout()
        return false;
      }
      */
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }
}

// Functional guard export
export const IsAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {
  return inject(AuthGuard).canActivate(route, state);
}