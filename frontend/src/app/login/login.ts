import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email = signal('azerkirolos00@gmail.com');
  password = signal('test123');
  message = signal('');
  messageType = signal<'success' | 'error'>('error');
  loading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  login() {
    this.loading.set(true);

    const result = this.authService.login(this.email(), this.password());
    this.message.set(result.message);
    this.messageType.set(result.success ? 'success' : 'error');

    if (result.success) {
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 500);
    }

    this.loading.set(false);
  }
}
