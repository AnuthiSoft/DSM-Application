import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeTrackingComponent } from './employee-tracking.component';

describe('EmployeeTrackingComponent', () => {
  let component: EmployeeTrackingComponent;
  let fixture: ComponentFixture<EmployeeTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmployeeTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
