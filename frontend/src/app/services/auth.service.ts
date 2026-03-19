import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {
    // Auto-login für Demo
    const email = 'azerkirolos00@gmail.com';
    const password = 'test123';
    localStorage.setItem('currentUser', JSON.stringify({ email }));
    this.isLoggedInSubject.next(true);
  }

  login(email: string, password: string) {
    if (email === 'azerkirolos00@gmail.com' && password === 'test123') {
      localStorage.setItem('currentUser', JSON.stringify({ email }));
      this.isLoggedInSubject.next(true);
      return { success: true, message: 'Login erfolgreich!' };
    }
    return { success: false, message: 'Email oder Passwort falsch.' };
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.isLoggedInSubject.next(false);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }
}
