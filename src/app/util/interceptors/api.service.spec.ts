import { TestBed } from '@angular/core/testing';

import { ApiInterceptor } from './api.service';

describe('ApiService', () => {
  let service: ApiInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiInterceptor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
