import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { SmartCaptchaComponent } from '@ngx-rock/yandex-smart-captcha';

const meta: Meta<SmartCaptchaComponent> = {
  title: 'SmartCaptcha/Standard',
  component: SmartCaptchaComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A real Yandex SmartCaptcha widget. Set a public site key whose allowed hosts include the current domain. The example key may not work on every host.',
      },
    },
  },
  argTypes: {
    sitekey: { control: 'text', description: 'Public Yandex SmartCaptcha site key' },
    language: { control: 'select', options: ['ru', 'en', 'be', 'kk', 'tt', 'uk', 'uz', 'tr'] },
    test: { control: 'boolean' },
    webview: { control: 'boolean' },
    host: { control: 'text' },
  },
  args: {
    sitekey: 'ysc1_5BXY0ZzOmISVWQvltJ1OIJNIDZQnN9MRK9SOQCg8dadc43b2',
    language: 'en',
    test: true,
    success: fn(),
    networkError: fn(),
    tokenExpired: fn(),
    javascriptError: fn(),
  },
};

export default meta;
type Story = StoryObj<SmartCaptchaComponent>;

export const Default: Story = {};
