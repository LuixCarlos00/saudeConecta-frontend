import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotFoudComponent } from './not-foud.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';

describe('NotFoudComponent', () => {
  let component: NotFoudComponent;
  let fixture: ComponentFixture<NotFoudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotFoudComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotFoudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
