import { TestBed } from '@angular/core/testing';

import { TourLogService } from './tour-log.service';

describe('TourLogService', () => {
  let service: TourLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TourLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
