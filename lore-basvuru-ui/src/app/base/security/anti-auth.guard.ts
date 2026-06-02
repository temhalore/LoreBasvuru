import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateFn
} from '@angular/router';
import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root',
})
export class AntiAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
  userMenuList: any[];
  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean> {

    let result: boolean = false;
    if (this.authService.currentUserValue.kisiTokenDto?.isLogin) {
    }
    if (this.authService.currentUserValue.kisiTokenDto === undefined) {
      result = true;
    } else if (this.authService.currentUserValue.kisiTokenDto?.isLogin) {
      this.router.navigate(['/']);
      result = false;
    }
    return result;
  }
}

export const IsAntiAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {
  return inject(AntiAuthGuard).canActivate(route, state)
}