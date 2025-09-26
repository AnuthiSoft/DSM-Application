import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsByDistComponent } from './products-by-dist.component';

describe('ProductsByDistComponent', () => {
  let component: ProductsByDistComponent;
  let fixture: ComponentFixture<ProductsByDistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductsByDistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductsByDistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
