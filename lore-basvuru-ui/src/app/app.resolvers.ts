import { inject } from '@angular/core';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { forkJoin, of, catchError } from 'rxjs';

export const initialDataResolver = () => {
    const navigationService = inject(NavigationService);
    // Diğer servisler (messages, notifications vb.) mock'tan geliyor - hata verirse boş dön
    return forkJoin([
        navigationService.get().pipe(catchError(() => of(null))),
    ]);
};
