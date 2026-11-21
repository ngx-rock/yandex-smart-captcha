import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Yandex SmartCaptcha',
    brandUrl: 'https://github.com/ngx-rock/yandex-smart-captcha',
    brandImage: './assets/logo.webp',
    brandTarget: '_self',
  }),
});
