import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashSummaryComponent } from './cash-summary.component';

describe('CashSummaryComponent', () => {
  let component: CashSummaryComponent;
  let fixture: ComponentFixture<CashSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CashSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
