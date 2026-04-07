import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  email: string;
  password?: string;
  name?: string;
  mobile?: string;
  location?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly CURRENT_USER_KEY = 'tp_current_user';
  // Hardcoded Benutzer für die Intermediate-Abgabe
  private readonly HARDCODED_EMAIL = 'azerkirolos00@gmail.com';
  private readonly HARDCODED_PASSWORD = 'test123';
  private readonly DEFAULT_USER: User = {
    email: 'azerkirolos00@gmail.com',
    name: 'Kirolos Azer',
    mobile: '+43 660 123 4567',
    location: 'Austria',
    avatar: 'https://i.pravatar.cc/150?img=1',
  };

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkLoggedIn());

  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {
    // Benutzer wird direkt beim Konstruktor eingeloggt (für Demo-Zwecke)
    this.autoLogin();
  }

  private autoLogin(): void {
    // Auto-Login für die Intermediate-Abgabe
    if (!localStorage.getItem(this.CURRENT_USER_KEY)) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(this.DEFAULT_USER));
      this.isLoggedInSubject.next(true);
      console.log('Auto-Login: ' + this.HARDCODED_EMAIL);
    }
  }

  login(email: string, password: string): { success: boolean; message: string } {
    // Hardcodiert - nur diese Credentials akzeptieren
    if (email === this.HARDCODED_EMAIL && password === this.HARDCODED_PASSWORD) {
      const user: User = { ...this.DEFAULT_USER, email };
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      this.isLoggedInSubject.next(true);
      return { success: true, message: 'Login erfolgreich!' };
    }

    return { success: false, message: 'Email oder Passwort ist falsch.' };
  }

  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.isLoggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return this.checkLoggedIn();
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  updateUser(user: User): { success: boolean; message: string } {
    try {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      return { success: true, message: 'Profil erfolgreich aktualisiert!' };
    } catch (error) {
      return { success: false, message: 'Fehler beim Aktualisieren des Profils.' };
    }
  }

  private checkLoggedIn(): boolean {
    return !!localStorage.getItem(this.CURRENT_USER_KEY);
  }
}
