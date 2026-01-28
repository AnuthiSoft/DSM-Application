import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributorSettingsComponent } from './distributor-settings.component';

describe('DistributorSettingsComponent', () => {
  let component: DistributorSettingsComponent;
  let fixture: ComponentFixture<DistributorSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DistributorSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributorSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
