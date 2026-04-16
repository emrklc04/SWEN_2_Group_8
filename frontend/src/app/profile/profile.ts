import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  currentUser: User | null = null;
  isEditing = signal(false);
  loading = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  name = signal('');
  email = signal('');
  mobile = signal('');
  location = signal('');
  avatar = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  // Lifecycle-Methode → wird beim Laden der Komponente ausgeführt
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      // Werte aus dem aktuellen Benutzer in die Signals übernehmen
      this.name.set(this.currentUser.name || '');
      this.email.set(this.currentUser.email || '');
      this.mobile.set(this.currentUser.mobile || '');
      this.location.set(this.currentUser.location || '');
      this.avatar.set(this.currentUser.avatar || 'https://i.pravatar.cc/150?img=1');
    }
  }

   toggleEdit(): void {
     this.isEditing.set(!this.isEditing());
     this.message.set('');
   }

   saveChanges(): void {
     this.loading.set(true);
     this.message.set('');

     if (!this.name() || !this.email()) {
       this.message.set('Name und Email sind erforderlich.');
       this.messageType.set('error');
       this.loading.set(false);
       return;
     }

     const updatedUser: User = {
       email: this.email(),
       name: this.name(),
       mobile: this.mobile(),
       location: this.location(),
       avatar: this.avatar(),
     };

     const result = this.authService.updateUser(updatedUser);
     this.message.set(result.message);
     this.messageType.set(result.success ? 'success' : 'error');
     if (result.success) {
       this.currentUser = updatedUser;
       this.loading.set(false);
       setTimeout(() => { this.isEditing.set(false); this.message.set(''); }, 2000);
     }
     this.loading.set(false);
   }

   logout(): void { this.authService.logout(); this.router.navigate(['/auth']); }
   backToDashboard(): void { this.router.navigate(['/dashboard']); }
}
