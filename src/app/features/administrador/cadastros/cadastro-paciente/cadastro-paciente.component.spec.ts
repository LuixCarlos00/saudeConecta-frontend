import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroPacienteComponent } from './cadastro-paciente.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';

describe('CadastroPacienteComponent', () => {
  let component: CadastroPacienteComponent;
  let fixture: ComponentFixture<CadastroPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CadastroPacienteComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CadastroPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
