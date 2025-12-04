import { Routes } from '@angular/router';
import { DroneDashboardComponent } from './components/drone-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DroneDashboardComponent,
  },
  {
    path: 'dashboard',
    component: DroneDashboardComponent,
  },
];
