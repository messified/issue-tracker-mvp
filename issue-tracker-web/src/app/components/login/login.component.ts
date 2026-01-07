import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';


@Component({
    selector: 'app-login',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatFormFieldModule,
        MatTabsModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  selectedTabIndex = signal(0); // 0 = Sign In, 1 = Sign Up
  loading = signal(false);

  // Computed signal to check if we're in sign up mode
  isSignUp = computed(() => this.selectedTabIndex() === 1);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  signUpForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Add custom validator for password confirmation
    this.signUpForm.addValidators(this.passwordMatchValidator);
  }

  passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  submit(): void {
    if (this.isSignUp()) {
      this.signUp();
    } else {
      this.login();
    }
  }

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.loading.set(false);
      }
    });
  }

  signUp(): void {
    if (this.signUpForm.invalid) {
      return;
    }

    this.loading.set(true);
    const { name, email, password } = this.signUpForm.value;

    this.authService.signUp(name!, email!, password!).subscribe({
      next: () => {
        this.router.navigate(['/projects']);
      },
      error: (error) => {
        console.error('Sign up error:', error);
        this.loading.set(false);
      }
    });
  }

  getErrorMessage(form: any, fieldName: string): string {
    const control = form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${fieldName} is required`;
    }
    if (control.errors['email']) {
      return 'Enter a valid email';
    }
    if (control.errors['minlength']) {
      return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['passwordMismatch']) {
      return 'Passwords do not match';
    }

    return '';
  }

  hasError(form: any, fieldName: string): boolean {
    const control = form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
