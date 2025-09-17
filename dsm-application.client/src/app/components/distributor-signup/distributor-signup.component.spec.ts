import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorSignupComponent } from './distributor-signup.component';

describe('DistributorSignupComponent', () => {
  let component: DistributorSignupComponent;
  let fixture: ComponentFixture<DistributorSignupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DistributorSignupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributorSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
