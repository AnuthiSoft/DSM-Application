import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorOrdersComponent } from './distributor-orders.component';

describe('DistributorOrdersComponent', () => {
  let component: DistributorOrdersComponent;
  let fixture: ComponentFixture<DistributorOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DistributorOrdersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributorOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
