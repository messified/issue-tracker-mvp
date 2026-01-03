import { Routes } from '@angular/router';
import { ProjectComponent } from './components/project/project.component';
import { IssueComponent } from './components/issue/issue.component';

export const routes: Routes = [
  { path: 'projects', component: ProjectComponent },
  { path: 'issues', component: IssueComponent },
  {
    path: 'issues/:id',
    loadComponent: () =>
      import('./components/issue-detail/issue-detail.component')
        .then(m => m.IssueDetailComponent)
  },
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  { path: '**', redirectTo: 'projects' }
];
