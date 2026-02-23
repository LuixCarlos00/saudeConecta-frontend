/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { NgrokInterceptor } from './ngGrok.service';

describe('Service: NgGrok', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NgrokInterceptor]
    });
  });

  it('should ...', inject([NgrokInterceptor], (service: NgrokInterceptor) => {
    expect(service).toBeTruthy();
  }));
});
