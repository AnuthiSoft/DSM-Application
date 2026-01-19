import { TestBed } from '@angular/core/testing';

import { GstService } from './gst.service';

describe('GstService', () => {
  let service: GstService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GstService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
