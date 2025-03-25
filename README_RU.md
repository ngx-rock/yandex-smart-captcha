# Angular Yandex Smart Captcha

[![npm version](https://badge.fury.io/js/@ngx-rock%2Fyandex-smart-captcha.svg)](https://badge.fury.io/js/@ngx-rock%2Fyandex-smart-captcha) [![GitHub license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/ngx-rock/memoize-pipe/blob/main/LICENSE)

Angular библиотека для интеграции Yandex SmartCaptcha в ваше приложение. Пакет предоставляет Angular-компоненты-обертки для JavaScript библиотеки Yandex SmartCaptcha, поддерживая как стандартный, так и невидимый режим работы. 
Компоненты реализуют интерфейсы `ControlValueAccessor` и `Validator` для интеграции с реактивными формами Angular, а также используют современные возможности Angular (сигналы и эффекты) для работы в `zoneless` режиме.

> **Примечание:** Документация основана на концепциях [Yandex SmartCaptcha для React](https://yandex.cloud/en-ru/docs/smartcaptcha/concepts/react?utm_referrer=about%3Ablank) и адаптирована под особенности Angular.

## Установка

Установите пакет через npm:

```bash
npm install @ngx-rock/yandex-smart-captcha
```

## Компоненты

Библиотека предоставляет два основных standalone-компонента:

- **SmartCaptchaComponent**: Стандартный компонент Yandex SmartCaptcha.
- **InvisibleSmartCaptchaComponent**: Расширение компонента SmartCaptchaComponent, настроенное для невидимого режима (invisible captcha).

Оба компонента реализуют интерфейсы `ControlValueAccessor` и `Validator`, что обеспечивает лёгкую интеграцию с реактивными формами Angular.

---

## Использование

### Импорт компонента

Так как компоненты являются standalone, вы можете напрямую импортировать их в модуль или компонент вашего приложения:

```typescript
import { SmartCaptchaComponent } from '@ngx-rock/yandex-smart-captcha';
// либо для невидимого капчи
import { InvisibleSmartCaptchaComponent } from '@ngx-rock/yandex-smart-captcha';
```

### Пример шаблона (Стандартная капча)

```html
<form [formGroup]="form">
  <smart-captcha
    formControlName="captcha"
    [sitekey]="'YOUR_SITE_KEY'"
    [theme]="'light'"
    [language]="'ru'"
    (challengeVisible)="onChallengeVisible()"
    (challengeHidden)="onChallengeHidden()"
    (success)="onSuccess($event)"
    (networkError)="onNetworkError()"
    (tokenExpired)="onTokenExpired()"
    (javascriptError)="onJavascriptError($event)"
  ></smart-captcha>
  
  <button type="submit" [disabled]="form.invalid">Отправить</button>
</form>
```

### Пример шаблона (Невидимая капча)

```html
<form [formGroup]="form">
  <invisible-smart-captcha
    formControlName="captcha"
    [sitekey]="'YOUR_SITE_KEY'"
    [theme]="'dark'"
    [language]="'ru'"
    (challengeVisible)="onChallengeVisible()"
    (challengeHidden)="onChallengeHidden()"
    (success)="onSuccess($event)"
    (networkError)="onNetworkError()"
    (tokenExpired)="onTokenExpired()"
    (javascriptError)="onJavascriptError($event)"
  ></invisible-smart-captcha>
  
  <button type="submit" [disabled]="form.invalid">Отправить</button>
</form>
```

---

## API Компонента

### Входные параметры (Inputs)

#### Общие (для обоих компонентов)
- **sitekey** (`string`, **обязательный**): Ваш ключ сайта для Yandex SmartCaptcha.
- **theme** (`'light' | 'dark'`, по умолчанию: `'light'`): Визуальная тема капчи.
- **language** (`string`): Локаль для отображения капчи (например, `'ru'` или `'en'`).
- **test** (`boolean`): Включает тестовый режим для разработки.
- **webview** (`boolean`): Включает специальное поведение для вебвью.

#### Специфичные
- **invisible** (`boolean`):
  - **SmartCaptchaComponent**: Определяет, работает ли капча в невидимом режиме.
  - **InvisibleSmartCaptchaComponent**: Всегда имеет значение `true`.
- **visible** (`boolean`): Триггер для выполнения невидимой капчи при изменении.
- **hideShield** (`boolean`): Опция для скрытия блока уведомления об обработке данных.
- **shieldPosition** (`'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`): Позиция блока, если он отображается.

### Исходящие события (Outputs)

- **challengeVisible**: Событие, возникающее при отображении капчи.
- **challengeHidden**: Событие, возникающее при скрытии капчи.
- **success**: Событие, которое передаёт токен капчи при успешном прохождении проверки.
- **networkError**: Событие, возникающее при ошибке загрузки капчи (сетевая ошибка).
- **tokenExpired**: Событие, возникающее при истечении срока действия полученного токена.
- **javascriptError**: Событие, передающее информацию об ошибке, возникшей в JavaScript капчи.
 
---

## Как это работает

1. **Загрузка скрипта и инициализация**  
   Компонент динамически создаёт и добавляет элемент `<script>` для загрузки API Yandex SmartCaptcha. Глобальный колбэк гарантирует, что капча будет отрисована сразу после загрузки скрипта.

2. **Отрисовка капчи**  
   После загрузки API компонент отрисовывает капчу в контейнере, указанном в шаблоне. Конфигурационные параметры (например, sitekey, тема, язык) передаются в экземпляр Yandex SmartCaptcha.

3. **Обработка событий и подписки**  
   Компонент устанавливает подписки на различные события (например, отображение/скрытие, успешное прохождение проверки, сетевые ошибки) и эмиттирует соответствующие Angular-события. Это позволяет добавлять пользовательскую логику на каждом этапе жизненного цикла.

4. **Валидация и доступ к значению**  
   После успешного прохождения капчи токен сохраняется во внутреннем состоянии и передается в Angular форму. Валидатор проверяет наличие токена (или откладывает валидацию для невидимой капчи до взаимодействия пользователя).

---

## Пример компонента

Ниже приведён пример использования компонента с реактивной формой:

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
      // Контрол для капчи будет хранить токен, возвращённый капчей
      captcha: [null, Validators.required],
    });
  }

  onChallengeVisible(): void {
    console.log('Капча отображена');
  }

  onChallengeHidden(): void {
    console.log('Капча скрыта');
  }

  onSuccess(token: string): void {
    console.log('Капча пройдена, токен:', token);
  }

  onNetworkError(): void {
    console.error('Ошибка сети при загрузке капчи');
  }

  onTokenExpired(): void {
    console.warn('Срок действия токена капчи истёк');
  }

  onJavascriptError(error: any): void {
    console.error('Ошибка JavaScript в капче:', error);
  }

  onSubmit(): void {
    if (this.form.valid) {
      // Обработка отправки формы
      console.log('Форма отправлена с токеном капчи:', this.form.value.captcha);
    } else {
      console.error('Форма невалидна');
    }
  }
}
```

---

## Опции настройки

Вы можете настраивать различные параметры капчи, передавая соответствующие входные значения:
- **Тема (theme)**: Переключайтесь между `'light'` и `'dark'`.
- **Язык (language)**: Задавайте локаль с помощью параметра `language`.
- **Настройка уведомления об обработке данных.**: Определяйте видимость и позицию блока с помощью `hideShield` и `shieldPosition`.

---

## Решение проблем

- **Ошибка неверного host**  
  Убедитесь, что значение параметра host соответствует необходимому формату (например, `domain.ru` или `localhost:3000`). Неверное значение приведёт к логированию ошибки и отмене отрисовки капчи.

- **Проблемы с загрузкой скрипта**  
  Проверьте, что ваша сеть позволяет доступ к API Yandex SmartCaptcha. Если скрипт не загружается, обратитесь к консоли браузера для получения подробной информации об ошибке.

- **Проблемы валидации формы**  
  Если контрол капчи остаётся невалидным, убедитесь, что пользователь взаимодействует с капчей (для невидимой капчи необходимо установить параметр `visible`).

---

## Вклад и развитие

Мы будем рады принять ваш вклад! Вы можете форкнуть репозиторий, внести изменения и отправить pull request. Если планируется серьёзное изменение, пожалуйста, сначала создайте issue для обсуждения.

---

## Лицензия

Распространяется под лицензией MIT.

---

## Ссылки и источники

- [Документация Yandex SmartCaptcha (React)](https://yandex.cloud/en-ru/docs/smartcaptcha/concepts/react?utm_referrer=about%3Ablank)
 
---

Эта документация предоставляет полный гайд для разработчиков по интеграции Yandex SmartCaptcha в Angular приложения с использованием **@ngx-rock/yandex-smart-captcha**. 
Наслаждайтесь безопасной и удобной интеграцией капчи в ваши проекты!

---

[English](README.md) | **[Русский](README_RU.md)**
