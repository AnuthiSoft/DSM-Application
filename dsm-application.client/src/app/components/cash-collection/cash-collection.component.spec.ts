import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashCollectionComponent } from './cash-collection.component';

describe('CashCollectionComponent', () => {
  let component: CashCollectionComponent;
  let fixture: ComponentFixture<CashCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CashCollectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
