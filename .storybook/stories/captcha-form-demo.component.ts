import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  InvisibleSmartCaptchaComponent,
  SmartCaptchaComponent,
} from '@ngx-rock/yandex-smart-captcha';

@Component({
  selector: 'captcha-form-demo',
  imports: [ReactiveFormsModule, SmartCaptchaComponent, InvisibleSmartCaptchaComponent],
  templateUrl: './captcha-form-demo.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './captcha-form-demo.component.css',
})
export class CaptchaFormDemoComponent {
  readonly mode = input<'standard' | 'invisible'>('standard');
  readonly isInvisible = computed(() => this.mode() === 'invisible');
  readonly sitekey = 'ysc1_5BXY0ZzOmISVWQvltJ1OIJNIDZQnN9MRK9SOQCg8dadc43b2';
  readonly visible = signal(false);
  readonly showCaptcha = signal(true);
  readonly checking = signal(false);
  readonly verified = signal(false);
  readonly submitted = signal(false);
  readonly attempted = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    captcha: new FormControl<string | null>(null),
  });

  constructor() {
    effect(() => {
      const message = this.form.controls.message;
      message.setValidators(this.isInvisible() ? [Validators.required] : []);
      message.updateValueAndValidity();
    });
  }

  get fieldsValid(): boolean {
    return this.form.controls.name.valid && this.form.controls.email.valid &&
      (!this.isInvisible() || this.form.controls.message.valid);
  }

  submit(): void {
    this.attempted.set(true);
    this.error.set('');
    this.form.markAllAsTouched();
    if (!this.fieldsValid) return;

    if (this.isInvisible() && !this.verified()) {
      this.checking.set(true);
      this.visible.set(true);
      return;
    }

    if (!this.verified()) {
      this.error.set('Complete the verification before continuing.');
      return;
    }
    this.finish();
  }

  onSuccess(): void {
    this.verified.set(true);
    this.checking.set(false);
    this.visible.set(false);
    this.error.set('');
    if (this.isInvisible() && this.attempted() && this.fieldsValid) this.finish();
  }

  onExpired(): void {
    this.verified.set(false);
    this.checking.set(false);
    this.visible.set(false);
    this.error.set('Verification expired. Please try again.');
  }

  onError(): void {
    this.checking.set(false);
    this.visible.set(false);
    this.error.set('Could not load verification. Check your connection and reload the page.');
  }

  onChallengeHidden(): void {
    this.visible.set(false);
    this.checking.set(false);
  }

  reset(): void {
    this.form.reset();
    this.verified.set(false);
    this.submitted.set(false);
    this.attempted.set(false);
    this.checking.set(false);
    this.visible.set(false);
    this.error.set('');
    this.showCaptcha.set(false);
    setTimeout(() => this.showCaptcha.set(true));
  }

  private finish(): void {
    this.checking.set(false);
    this.submitted.set(true);
  }
}
