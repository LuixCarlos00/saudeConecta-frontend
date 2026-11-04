import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroMedicoComponent } from './cadastro-medico.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';

describe('CadastroMedicoComponent', () => {
  let component: CadastroMedicoComponent;
  let fixture: ComponentFixture<CadastroMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CadastroMedicoComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CadastroMedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
