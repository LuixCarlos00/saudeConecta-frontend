/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Template_PDFComponent } from './template_PDF.component';

describe('Template_PDFComponent', () => {
  let component: Template_PDFComponent;
  let fixture: ComponentFixture<Template_PDFComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Template_PDFComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Template_PDFComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
