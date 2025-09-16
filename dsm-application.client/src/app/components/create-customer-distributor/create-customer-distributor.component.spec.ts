import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCustomerDistributorComponent } from './create-customer-distributor.component';

describe('CreateCustomerDistributorComponent', () => {
  let component: CreateCustomerDistributorComponent;
  let fixture: ComponentFixture<CreateCustomerDistributorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateCustomerDistributorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCustomerDistributorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
