import { TestBed } from '@angular/core/testing';

import { InvoiceUploadService } from './invoice-upload.service';

describe('InvoiceUploadService', () => {
  let service: InvoiceUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoiceUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
