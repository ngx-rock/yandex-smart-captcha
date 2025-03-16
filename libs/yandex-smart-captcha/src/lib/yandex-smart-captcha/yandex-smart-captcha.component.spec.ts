import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxRockYandexSmartCaptchaComponent } from './yandex-smart-captcha.component';

describe('NgxRockYandexSmartCaptchaComponent', () => {
  let component: NgxRockYandexSmartCaptchaComponent;
  let fixture: ComponentFixture<NgxRockYandexSmartCaptchaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxRockYandexSmartCaptchaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxRockYandexSmartCaptchaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
