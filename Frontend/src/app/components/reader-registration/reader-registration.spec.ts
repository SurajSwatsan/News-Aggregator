import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReaderRegistration } from './reader-registration';

describe('ReaderRegistration', () => {
  let component: ReaderRegistration;
  let fixture: ComponentFixture<ReaderRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReaderRegistration]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReaderRegistration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
