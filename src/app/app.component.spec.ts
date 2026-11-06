import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { SCHEMAS_TESTE_PADRAO } from './testing/configuracao-teste';

describe('AppComponent', () => {
  let logado: boolean;

  beforeEach(async () => {
    logado = false;
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [{ provide: AuthService, useValue: { isLoggedIn: () => logado } }],
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it(`should have as title 'saudeConecta'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toEqual('saudeConecta');
  });

  it('não deve renderizar a barra lateral quando deslogado', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-barra-Latera')).toBeNull();
  });

  it('deve renderizar a barra lateral quando logado', () => {
    logado = true;
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-barra-Latera')).not.toBeNull();
  });
});
