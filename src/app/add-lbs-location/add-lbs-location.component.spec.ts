import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLbsLocationComponent } from './add-lbs-location.component';

describe('AddLbsLocationComponent', () => {
  let component: AddLbsLocationComponent;
  let fixture: ComponentFixture<AddLbsLocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddLbsLocationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLbsLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
