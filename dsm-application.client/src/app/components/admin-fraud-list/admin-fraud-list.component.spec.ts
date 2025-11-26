import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFraudListComponent } from './admin-fraud-list.component';

describe('AdminFraudListComponent', () => {
  let component: AdminFraudListComponent;
  let fixture: ComponentFixture<AdminFraudListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminFraudListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminFraudListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
