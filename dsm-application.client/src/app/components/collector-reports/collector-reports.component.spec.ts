import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectorReportsComponent } from './collector-reports.component';

describe('CollectorReportsComponent', () => {
  let component: CollectorReportsComponent;
  let fixture: ComponentFixture<CollectorReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CollectorReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectorReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
