import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FraudHistoryComponent } from './fraud-history.component';

describe('FraudHistoryComponent', () => {
  let component: FraudHistoryComponent;
  let fixture: ComponentFixture<FraudHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FraudHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FraudHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
