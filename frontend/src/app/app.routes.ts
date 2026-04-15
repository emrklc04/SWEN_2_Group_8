import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Profile } from './profile/profile';
import { TourDetail } from './tour-detail/tour-detail';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'auth', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'profile', component: Profile },
  { path: 'tour/:id', component: TourDetail },
];
