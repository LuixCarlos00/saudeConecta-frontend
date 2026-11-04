/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogService } from './dialog.service';

describe('Service: Dialog', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MatDialogModule],
      providers: [DialogService]
    });
  });

  it('should ...', inject([DialogService], (service: DialogService) => {
    expect(service).toBeTruthy();
  }));
});
