import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublisherDashboard } from './publisher-dashboard';

describe('PublisherDashboard', () => {
  let component: PublisherDashboard;
  let fixture: ComponentFixture<PublisherDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublisherDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublisherDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
