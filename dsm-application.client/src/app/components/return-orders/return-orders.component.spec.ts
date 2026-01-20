import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnOrdersComponent } from './return-orders.component';

describe('ReturnOrdersComponent', () => {
  let component: ReturnOrdersComponent;
  let fixture: ComponentFixture<ReturnOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReturnOrdersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReturnOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
