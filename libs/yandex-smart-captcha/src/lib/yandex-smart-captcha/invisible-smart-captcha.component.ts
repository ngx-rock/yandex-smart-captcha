import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SmartCaptchaComponent } from './yandex-smart-captcha.component';

@Component({
  selector: 'invisible-smart-captcha',
  templateUrl: './captcha-container.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InvisibleSmartCaptchaComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => InvisibleSmartCaptchaComponent),
      multi: true,
    },
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvisibleSmartCaptchaComponent extends SmartCaptchaComponent {
  override invisible = input(true);
}
