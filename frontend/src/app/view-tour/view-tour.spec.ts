import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTour } from './view-tour';

describe('ViewTour', () => {
  let component: ViewTour;
  let fixture: ComponentFixture<ViewTour>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewTour],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewTour);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
