import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class NullInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const clonedRequest = req.clone({
      body: this.replaceUndefinedWithNull(req.body)
    });
    return next.handle(clonedRequest);
  }

  private replaceUndefinedWithNull(obj: any): any {
    if (obj === undefined) {
      return null;
    }

    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    for (const key of Object.keys(obj)) {
      obj[key] = this.replaceUndefinedWithNull(obj[key]);
    }

    return obj;
  }
}
