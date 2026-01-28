import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCollectionForCashcollectorComponent } from './payment-collection-for-cashcollector.component';

describe('PaymentCollectionForCashcollectorComponent', () => {
  let component: PaymentCollectionForCashcollectorComponent;
  let fixture: ComponentFixture<PaymentCollectionForCashcollectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentCollectionForCashcollectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentCollectionForCashcollectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
