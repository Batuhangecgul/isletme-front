import { TestBed } from '@angular/core/testing';

import { SorulamaServisiService } from './sorulama-servisi.service';

describe('SorulamaServisiService', () => {
  let service: SorulamaServisiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SorulamaServisiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
