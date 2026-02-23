import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Theme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  isDark: boolean;
}

export type ThemeType = 'light' | 'dark-blue' | 'dark-black';

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private currentThemeSubject = new BehaviorSubject<Theme>(this.getDefaultTheme());
  readonly currentTheme$: Observable<Theme> = this.currentThemeSubject.asObservable();
  readonly isDarkMode$: Observable<boolean> = new BehaviorSubject<boolean>(false).asObservable();

  private getDefaultTheme(): Theme {
    return {
      primary: '#007bff',
      secondary: '#6c757d',
      background: '#ffffff',
      text: '#212529',
      isDark: false
    };
  }

  private getDarkTheme(): Theme {
    return {
      primary: '#0d6efd',
      secondary: '#6c757d',
      background: '#121212',
      text: '#ffffff',
      isDark: true
    };
  }

  readonly availableThemes: ThemeConfig[] = [
    { id: 'light', name: 'Claro', description: 'Tema claro padrão' },
    { id: 'dark-blue', name: 'Escuro Azul', description: 'Tema escuro com tons de azul' },
    { id: 'dark-black', name: 'Escuro Preto', description: 'Tema escuro puro' }
  ];

  setTheme(themeOrId: Theme | ThemeType): void {
    let theme: Theme;
    if (typeof themeOrId === 'string') {
      theme = themeOrId === 'light' ? this.getDefaultTheme() : this.getDarkTheme();
      localStorage.setItem('themeId', themeOrId);
    } else {
      theme = themeOrId;
    }
    this.currentThemeSubject.next(theme);
    localStorage.setItem('theme', JSON.stringify(theme));
  }

  toggleDarkMode(): void {
    const current = this.currentThemeSubject.value;
    const newTheme = current.isDark ? this.getDefaultTheme() : this.getDarkTheme();
    this.setTheme(newTheme);
  }

  toggleTheme(): void {
    this.toggleDarkMode();
  }

  loadSavedTheme(): void {
    const saved = localStorage.getItem('theme');
    if (saved) {
      try {
        const theme = JSON.parse(saved) as Theme;
        this.currentThemeSubject.next(theme);
      } catch {
        // Usar tema padrão se não conseguir fazer parse
      }
    }
  }

  get currentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  get isDarkMode(): boolean {
    return this.currentThemeSubject.value.isDark;
  }
}
