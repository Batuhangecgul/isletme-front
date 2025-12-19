import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './core/http/auth.interceptor';
import { HttpErrorInterceptor } from './core/http/error.interceptor';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AnasayfaComponent } from './anasayfa/anasayfa.component';
import { LoginComponent } from './login/login.component';
import { IsletmePanelComponent } from './isletme-panel/isletme-panel.component';
import { RandevuComponent } from './anasayfa/randevu/randevu.component';

@NgModule({
  declarations: [
    AppComponent,
    AnasayfaComponent,
    LoginComponent,
    IsletmePanelComponent,
    RandevuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
