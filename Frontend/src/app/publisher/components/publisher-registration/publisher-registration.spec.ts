import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublisherRegistration } from './publisher-registration';

describe('PublisherRegistration', () => {
  let component: PublisherRegistration;
  let fixture: ComponentFixture<PublisherRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublisherRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublisherRegistration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
