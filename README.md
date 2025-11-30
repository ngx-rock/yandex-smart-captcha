# Angular Yandex Smart Captcha

[![npm version](https://badge.fury.io/js/@ngx-rock%2Fyandex-smart-captcha.svg)](https://badge.fury.io/js/@ngx-rock%2Fyandex-smart-captcha) [![GitHub license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/ngx-rock/memoize-pipe/blob/main/LICENSE)

An Angular library for integrating Yandex SmartCaptcha into your applications. This package provides Angular components that wrap the Yandex SmartCaptcha JavaScript library, supporting both standard and invisible captchas. 
It leverages Angular’s reactive forms (via `ControlValueAccessor` and `Validator`) and modern features like signals and effects (with `zoneless` support).

> **Note:** This documentation mirrors the concepts from the [Yandex SmartCaptcha React documentation](https://yandex.cloud/en-ru/docs/smartcaptcha/concepts/react?utm_referrer=about%3Ablank) while adapting them to Angular.

## Installation

Install the package via npm:

```bash
npm install @ngx-rock/yandex-smart-captcha
```

## Components

This library provides two main standalone components:

- **SmartCaptchaComponent**: The standard Yandex SmartCaptcha component.
- **InvisibleSmartCaptchaComponent**: An extension of `SmartCaptchaComponent` configured for invisible captcha behavior.

Both components implement Angular’s `ControlValueAccessor` and `Validator`, making them easily integrated into reactive forms.

---

## Usage

### Importing the Component

Since the components are standalone, you can directly import them into your Angular module or component:

```typescript
import { SmartCaptchaComponent } from '@ngx-rock/yandex-smart-captcha';
// or for invisible captcha
import { InvisibleSmartCaptchaComponent } from '@ngx-rock/yandex-smart-captcha';
```

### Template Example (Standard Captcha)

```html
<form [formGroup]="form">
  <smart-captcha
    formControlName="captcha"
    [sitekey]="'YOUR_SITE_KEY'"
    [language]="'en'"
    (challengeVisible)="onChallengeVisible()"
    (challengeHidden)="onChallengeHidden()"
    (success)="onSuccess($event)"
    (networkError)="onNetworkError()"
    (tokenExpired)="onTokenExpired()"
    (javascriptError)="onJavascriptError($event)"
  ></smart-captcha>
  
  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

### Template Example (Invisible Captcha)

```html
<form [formGroup]="form">
  <invisible-smart-captcha
    formControlName="captcha"
    [sitekey]="'YOUR_SITE_KEY'"
    [language]="'en'"
    (challengeVisible)="onChallengeVisible()"
    (challengeHidden)="onChallengeHidden()"
    (success)="onSuccess($event)"
    (networkError)="onNetworkError()"
    (tokenExpired)="onTokenExpired()"
    (javascriptError)="onJavascriptError($event)"
  ></invisible-smart-captcha>
  
  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

---

## Component API

### Inputs

#### Common Inputs (for both components)
- **sitekey** (`string`, **required**): Your Yandex SmartCaptcha site key.
- **language** (`string`): Locale code for language customization (e.g., `'en'` or `'ru'`).
- **test** (`boolean`): Enable test mode for development.
- **webview** (`boolean`): Enable special behavior for webview contexts.

#### Specific Inputs
- **invisible** (`boolean`):
  - **SmartCaptchaComponent**: Determines whether the captcha is invisible.
  - **InvisibleSmartCaptchaComponent**: Always set to `true` (cannot be overridden).
- **visible** (`boolean`): Triggers the execution for invisible captcha when set.
- **hideShield** (`boolean`): Option to hide the shield.
- **shieldPosition** (`'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`): Position of the shield with data processing notice when visible.
 
### Outputs (Events)

- **challengeVisible**: Emitted when the captcha challenge is displayed.
- **challengeHidden**: Emitted when the captcha challenge is hidden.
- **success**: Emitted with the token string when the captcha is successfully solved.
- **networkError**: Emitted when there is a network error loading the captcha.
- **tokenExpired**: Emitted when the previously obtained token expires.
- **javascriptError**: Emitted with an error payload if a JavaScript error occurs in the captcha script.

---

## How It Works

1. **Script Loading & Initialization**:  
   The component dynamically creates and appends a `<script>` tag to load the Yandex SmartCaptcha API. A shared callback mechanism ensures that the captcha is rendered as soon as the script is ready.

2. **Rendering the Captcha**:  
   Once the API is loaded, the component renders the captcha inside the container element referenced in the template. It passes the configuration parameters (such as sitekey, theme, language, etc.) to the underlying Yandex SmartCaptcha instance.

3. **Event Handling & Subscriptions**:  
   The component sets up subscriptions to various captcha events (e.g., challenge visibility, success, network errors) and emits Angular outputs accordingly. This allows you to hook custom logic into the captcha lifecycle.

4. **Validation & Value Access**:  
   When the captcha is solved, the token is set internally and propagated to Angular forms via the registered change callback. The validator ensures that a token exists (or defers validation for invisible captcha until user interaction).

---

## Example Component

Here is an example of an Angular component using the SmartCaptcha:

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-captcha-form',
  templateUrl: './captcha-form.component.html',
})
export class CaptchaFormComponent {
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      // The captcha control will store the token returned by the captcha
      captcha: [null, Validators.required],
    });
  }

  onChallengeVisible(): void {
    console.log('Captcha challenge visible');
  }

  onChallengeHidden(): void {
    console.log('Captcha challenge hidden');
  }

  onSuccess(token: string): void {
    console.log('Captcha solved, token:', token);
  }

  onNetworkError(): void {
    console.error('Captcha network error');
  }

  onTokenExpired(): void {
    console.warn('Captcha token expired');
  }

  onJavascriptError(error: any): void {
    console.error('Captcha javascript error:', error);
  }

  onSubmit(): void {
    if (this.form.valid) {
      // Process form submission
      console.log('Form submitted with captcha token:', this.form.value.captcha);
    } else {
      console.error('Form is invalid');
    }
  }
}
```

---

## Customization Options

You can customize various aspects of the captcha by passing different inputs:

- **Language**: Adjust the captcha language with the `language` input.
- **Shield Customization**: Configure shield visibility and position with `hideShield` and `shieldPosition`.

---

## Troubleshooting

- **Invalid Host Error**:  
  Ensure the host input is in the correct format (e.g., `domain.ru` or `localhost:3000`). An invalid host will log an error and prevent captcha rendering.

- **Script Loading Issues**:  
  Verify that your network allows access to the Yandex SmartCaptcha API endpoint. Check your browser console for errors if the script fails to load.

- **Form Validation**:  
  If the captcha control remains invalid, ensure that the user interacts with the captcha (for invisible captcha, make sure the `visible` input is triggered).

---

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

---

## License

Distributed under the MIT License.

---

## References 

- [Yandex SmartCaptcha 2.9.0 Documentation (React)](https://yandex.cloud/en-ru/docs/smartcaptcha/concepts/react?utm_referrer=about%3Ablank)

---

This documentation should provide a complete guide for developers integrating the Yandex SmartCaptcha into their Angular projects using **@ngx-rock/yandex-smart-captcha**. 
Enjoy secure and seamless captcha integration in your Angular apps!

---

**[English](README.md)** | [Русский](README_RU.md)
