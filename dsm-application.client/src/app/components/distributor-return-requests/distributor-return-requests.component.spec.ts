import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorReturnRequestsComponent } from './distributor-return-requests.component';

describe('DistributorReturnRequestsComponent', () => {
  let component: DistributorReturnRequestsComponent;
  let fixture: ComponentFixture<DistributorReturnRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DistributorReturnRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributorReturnRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
