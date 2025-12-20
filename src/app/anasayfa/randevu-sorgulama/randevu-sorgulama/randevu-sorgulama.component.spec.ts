import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RandevuSorgulamaComponent } from './randevu-sorgulama.component';

describe('RandevuSorgulamaComponent', () => {
  let component: RandevuSorgulamaComponent;
  let fixture: ComponentFixture<RandevuSorgulamaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RandevuSorgulamaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RandevuSorgulamaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
