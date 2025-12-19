import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Basic normalization for API errors
        const status = error.status;
        const message = (error.error && (error.error.message || error.error.error)) || error.message || 'Beklenmeyen hata';

        // Optionally log; could integrate with a toast service later
        console.error('HTTP Error:', { status, message, url: req.url });

        return throwError(() => ({ status, message }));
      })
    );
  }
}
