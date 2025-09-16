import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorDashboardComponent } from './distributor-dashboard.component';

describe('DistributorDashboardComponent', () => {
  let component: DistributorDashboardComponent;
  let fixture: ComponentFixture<DistributorDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DistributorDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributorDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
