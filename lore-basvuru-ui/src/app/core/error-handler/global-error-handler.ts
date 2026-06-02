import { ErrorHandler, Injectable, NgZone, isDevMode } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  
  constructor(private zone: NgZone) {}

  handleError(error: any): void {
    // ExpressionChangedAfterItHasBeenCheckedError'ları tamamen sustur (warning bile gösterme)
    if (error?.message?.includes('ExpressionChangedAfterItHasBeenCheckedError') || 
        error?.name === 'ExpressionChangedAfterItHasBeenCheckedError' ||
        error?.toString()?.includes('NG0100') ||
        error?.message?.includes('RuntimeError: NG0100')) {
      
      // Tamamen sus - hiçbir log yazdırma
      return;
    }

    // Diğer hataları normal şekilde handle et
    this.zone.run(() => {
      if (isDevMode()) {
        console.error('🚨 Global Error:', error);
      } else {
        // Production'da user-friendly hata gösterimi
        console.error('An error occurred:', error?.message || 'Unknown error');
      }
    });
  }
}
