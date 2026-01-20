import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeReturnOrdersComponent } from './employee-return-orders.component';

describe('EmployeeReturnOrdersComponent', () => {
  let component: EmployeeReturnOrdersComponent;
  let fixture: ComponentFixture<EmployeeReturnOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeReturnOrdersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeReturnOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
