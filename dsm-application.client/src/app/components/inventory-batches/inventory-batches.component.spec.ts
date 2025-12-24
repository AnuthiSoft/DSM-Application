import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryBatchesComponent } from './inventory-batches.component';

describe('InventoryBatchesComponent', () => {
  let component: InventoryBatchesComponent;
  let fixture: ComponentFixture<InventoryBatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventoryBatchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryBatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
