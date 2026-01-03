import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { ProjectComponent } from './components/project/project.component';
import { IssueComponent } from './components/issue/issue.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'projects', component: ProjectComponent },
      { path: 'issues', component: IssueComponent },
      {
        path: 'issues/:id',
        loadComponent: () =>
          import('./components/issue-detail/issue-detail.component')
            .then(m => m.IssueDetailComponent)
      },
      { path: '', redirectTo: 'projects', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
