import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  message = signal('');
  messageType = signal<'success' | 'error'>('error');
  loading = signal(false);

  register() {
    this.loading.set(true);

    if (!this.name() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.message.set('Please fill in all fields.');
      this.messageType.set('error');
      this.loading.set(false);
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.message.set('Passwords do not match.');
      this.messageType.set('error');
      this.loading.set(false);
      return;
    }

    this.message.set('Registration successful! (Frontend only)');
    this.messageType.set('success');
    this.loading.set(false);
  }
}
