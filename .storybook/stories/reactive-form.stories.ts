import { Component, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  InvisibleSmartCaptchaComponent,
  SmartCaptchaComponent,
} from '@ngx-rock/yandex-smart-captcha';
import type { Meta, StoryObj } from '@storybook/angular';

@Component({
  selector: 'captcha-form-demo',
  imports: [ReactiveFormsModule, SmartCaptchaComponent, InvisibleSmartCaptchaComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      @if (invisible()) {
        <invisible-smart-captcha
          [sitekey]="sitekey()"
          [test]="true"
          [visible]="visible()"
          (challengeHidden)="visible.set(false)"
          formControlName="captcha" />
      } @else {
        <smart-captcha [sitekey]="sitekey()" [test]="true" formControlName="captcha" />
      }
      <button type="submit">{{ invisible() ? 'Start challenge' : 'Submit' }}</button>
      <p>Form status: {{ form.status }}</p>
      <p>Token: {{ form.controls.captcha.value || '—' }}</p>
    </form>
  `,
})
class CaptchaFormDemoComponent {
  sitekey = input.required<string>();
  invisible = input(false);
  visible = signal(false);
  form = new FormGroup({ captcha: new FormControl('', Validators.required) });

  submit() {
    if (this.invisible()) {
      this.visible.set(false);
      queueMicrotask(() => this.visible.set(true));
    }
  }
}

const meta: Meta<CaptchaFormDemoComponent> = {
  title: 'SmartCaptcha/Reactive forms',
  component: CaptchaFormDemoComponent,
  parameters: {
    docs: {
      description: {
        component: 'Use a site key that allows the current domain to try the real widget.',
      },
    },
  },
  argTypes: { sitekey: { control: 'text' }, invisible: { control: 'boolean' } },
  args: {
    sitekey: 'ysc1_5BXY0ZzOmISVWQvltJ1OIJNIDZQnN9MRK9SOQCg8dadc43b2',
    invisible: false,
  },
};

export default meta;
type Story = StoryObj<CaptchaFormDemoComponent>;

export const Standard: Story = {};
export const Invisible: Story = { args: { invisible: true } };
