import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingHandoversComponent } from './pending-handovers.component';

describe('PendingHandoversComponent', () => {
  let component: PendingHandoversComponent;
  let fixture: ComponentFixture<PendingHandoversComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingHandoversComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingHandoversComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
