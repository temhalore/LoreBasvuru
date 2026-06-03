import { inject } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { AuthService } from 'app/base/services/auth.service';
import { forkJoin, of, catchError } from 'rxjs';

export const initialDataResolver = () => {
    const navigationService = inject(NavigationService);
    const authService = inject(AuthService);

    // Eğer localStorage'da token varsa, TokenDogrula ile ekranDtoList ve widgetKodlari yükle
    if (authService.isLoggedIn) {
        return authService.TokenDogrula().pipe(
            catchError(() => of(null))
        );
    }

    return of(null);
};
