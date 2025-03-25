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

@Component({
  imports: [
    InvisibleSmartCaptchaComponent,
    SmartCaptchaComponent,
    ReactiveFormsModule,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  sitekey = 'ysc1_5BXY0ZzOmISVWQvltJ1OIJNIDZQnN9MRK9SOQCg8dadc43b2';

  visible = signal(false);

  form = new FormGroup({
    code: new FormControl('', [Validators.required]),
  });

  formInvisible = new FormGroup({
    code: new FormControl(),
  });

  submit() {
    if (this.form.valid) {
      console.log('Code', this.form.get('code')?.value);
    }
  }

  submitInvisibleForm() {
    if (this.formInvisible.valid) {
      this.visible.set(true);
    }
  }
}
