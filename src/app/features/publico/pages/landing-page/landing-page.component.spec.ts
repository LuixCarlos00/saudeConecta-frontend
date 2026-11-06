import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { PlanoApiService } from 'src/app/core/data-access/plano-api.service';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent — cabeçalho', () => {
  let fixture: ComponentFixture<LandingPageComponent>;
  let component: LandingPageComponent;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LandingPageComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [
        { provide: PlanoApiService, useValue: { listarPlanosAtivos: () => of([]) } },
      ],
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
  });

  it('mostra "Criar conta" ao lado de "Entrar" no cabeçalho desktop', () => {
    const acoes = fixture.debugElement.query(By.css('.header-acoes'));
    const botoes = acoes.queryAll(By.css('button')).map(b => b.nativeElement.textContent.trim());

    expect(botoes).toEqual(['Criar conta', 'Entrar']);
  });

  it('"Criar conta" do cabeçalho abre o cadastro sem plano pré-selecionado', () => {
    fixture.debugElement.query(By.css('.btn-cadastro-header')).nativeElement.click();

    expect(router.navigate).toHaveBeenCalledWith(['/cadastro'], {});
  });

  it('"Entrar" do cabeçalho continua indo para o login', () => {
    fixture.debugElement.query(By.css('.btn-login-header')).nativeElement.click();

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('"Criar conta" do menu mobile abre o cadastro e fecha o menu', () => {
    component.mobileMenuOpen = true;
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.btn-cadastro-mobile')).nativeElement.click();

    expect(router.navigate).toHaveBeenCalledWith(['/cadastro'], {});
    expect(component.mobileMenuOpen).toBeFalse();
  });
});
