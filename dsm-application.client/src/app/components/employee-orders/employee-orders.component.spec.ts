import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeOrdersComponent } from './employee-orders.component';

describe('EmployeeOrdersComponent', () => {
  let component: EmployeeOrdersComponent;
  let fixture: ComponentFixture<EmployeeOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeOrdersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
