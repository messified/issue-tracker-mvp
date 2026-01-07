import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
    selector: 'app-layout',
    imports: [
        CommonModule,
        RouterModule,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatIconModule,
        MatButtonModule
    ],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  user = signal<AuthUser | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Subscribe to user changes
    this.authService.userObservable$.subscribe(user => {
      this.user.set(user);
    });
    
    // Get initial user
    this.user.set(this.authService.getCurrentUser());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
