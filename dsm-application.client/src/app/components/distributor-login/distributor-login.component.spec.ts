import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorLoginComponent } from './distributor-login.component';

describe('DistributorLoginComponent', () => {
  let component: DistributorLoginComponent;
  let fixture: ComponentFixture<DistributorLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DistributorLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributorLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
