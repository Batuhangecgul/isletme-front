import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnasayfaComponent } from './anasayfa/anasayfa.component';
import { LoginComponent } from './login/login.component';
import { IsletmePanelComponent } from './isletme-panel/isletme-panel.component';
import { RandevuComponent } from './anasayfa/randevu/randevu.component';

const routes: Routes = [
  { path: '', component: AnasayfaComponent },
  { path: 'login', component: LoginComponent },
  { path: 'isletme-panel/:id', component: IsletmePanelComponent },
  { path: 'randevu/:id', component: RandevuComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
