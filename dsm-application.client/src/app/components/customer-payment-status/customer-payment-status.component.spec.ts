import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPaymentStatusComponent } from './customer-payment-status.component';

describe('CustomerPaymentStatusComponent', () => {
  let component: CustomerPaymentStatusComponent;
  let fixture: ComponentFixture<CustomerPaymentStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomerPaymentStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerPaymentStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
