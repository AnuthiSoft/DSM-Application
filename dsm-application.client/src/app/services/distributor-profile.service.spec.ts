import { TestBed } from '@angular/core/testing';

import { DistributorProfileService } from './distributor-profile.service';

describe('DistributorProfileService', () => {
  let service: DistributorProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DistributorProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
