import type { Meta, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { InvisibleSmartCaptchaComponent } from '@ngx-rock/yandex-smart-captcha';

const meta: Meta<InvisibleSmartCaptchaComponent> = {
  title: 'SmartCaptcha/Invisible',
  component: InvisibleSmartCaptchaComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Set Visible to true to start the challenge. The site key must allow the current domain.',
      },
    },
  },
  argTypes: {
    sitekey: { control: 'text' },
    visible: { control: 'boolean', description: 'Start the invisible challenge' },
    test: { control: 'boolean' },
    hideShield: { control: 'boolean' },
    shieldPosition: {
      control: 'select',
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    },
  },
  args: {
    sitekey: 'ysc1_5BXY0ZzOmISVWQvltJ1OIJNIDZQnN9MRK9SOQCg8dadc43b2',
    test: true,
    visible: false,
    success: fn(),
    challengeVisible: fn(),
    challengeHidden: fn(),
    networkError: fn(),
    javascriptError: fn(),
  },
};

export default meta;
type Story = StoryObj<InvisibleSmartCaptchaComponent>;

export const Default: Story = {};
