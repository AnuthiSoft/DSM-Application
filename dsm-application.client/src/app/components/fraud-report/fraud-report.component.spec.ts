import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FraudReportComponent } from './fraud-report.component';

describe('FraudReportComponent', () => {
  let component: FraudReportComponent;
  let fixture: ComponentFixture<FraudReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FraudReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FraudReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
