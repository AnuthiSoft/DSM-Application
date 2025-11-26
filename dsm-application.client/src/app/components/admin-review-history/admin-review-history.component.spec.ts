import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminReviewHistoryComponent } from './admin-review-history.component';

describe('AdminReviewHistoryComponent', () => {
  let component: AdminReviewHistoryComponent;
  let fixture: ComponentFixture<AdminReviewHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminReviewHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminReviewHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
