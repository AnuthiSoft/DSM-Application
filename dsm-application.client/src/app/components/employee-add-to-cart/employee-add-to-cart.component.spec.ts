import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeAddToCartComponent } from './employee-add-to-cart.component';

describe('EmployeeAddToCartComponent', () => {
  let component: EmployeeAddToCartComponent;
  let fixture: ComponentFixture<EmployeeAddToCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeAddToCartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeAddToCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
