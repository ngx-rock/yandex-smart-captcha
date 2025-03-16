import { Component, signal } from '@angular/core';
import {
  InvisibleSmartCaptchaComponent,
  SmartCaptchaComponent,
} from '@ngx-rock/yandex-smart-captcha';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  imports: [
    InvisibleSmartCaptchaComponent,
    SmartCaptchaComponent,
    JsonPipe,
    ReactiveFormsModule,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  hidden = signal(true);
  visible = signal(false);

  form = new FormGroup({
    text: new FormControl(),
    code: new FormControl('', [Validators.required]),
  });

  formInvisible = new FormGroup({
    text: new FormControl(),
    code: new FormControl(),
  });

  submit() {
    console.error('form', this.form.errors);
    if (this.form.valid) {
      this.visible.set(true);
    }
  }

  submit2() {
    console.error('formInvisible', this.formInvisible.valid);
    if (this.formInvisible.valid) {
      this.visible.set(true);
    }
  }
}
