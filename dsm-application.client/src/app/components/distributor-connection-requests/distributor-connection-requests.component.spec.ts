import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorConnectionRequestsComponent } from './distributor-connection-requests.component';

describe('DistributorConnectionRequestsComponent', () => {
  let component: DistributorConnectionRequestsComponent;
  let fixture: ComponentFixture<DistributorConnectionRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DistributorConnectionRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributorConnectionRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
