import { TestBed } from '@angular/core/testing';

import { IsletmeService } from './isletme.service';

describe('IsletmeService', () => {
  let service: IsletmeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IsletmeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
