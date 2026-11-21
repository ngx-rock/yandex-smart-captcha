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
    language: { control: 'select', options: ['ru', 'en', 'be', 'kk', 'tt', 'uk', 'uz', 'tr'] },
    visible: { control: 'boolean', description: 'Start the invisible challenge' },
    test: { control: 'boolean' },
    hideShield: {
      control: 'boolean',
      description:
        'Hide the data-processing notice. If omitted, the notice is visible (equivalent to false).',
      table: { defaultValue: { summary: 'undefined (notice visible)' } },
    },
    shieldPosition: {
      control: 'select',
      options: [
        'top-left', 'center-left', 'bottom-left',
        'top-right', 'center-right', 'bottom-right',
      ],
    },
  },
  args: {
    sitekey: 'ysc1_5BXY0ZzOmISVWQvltJ1OIJNIDZQnN9MRK9SOQCg8dadc43b2',
    test: true,
    visible: false,
    hideShield: false,
    success: fn(),
    challengeVisible: fn(),
    challengeHidden: fn(),
    networkError: fn(),
    javascriptError: fn(),
  },
  render: (args) => ({
    props: args,
    template: `
      <invisible-smart-captcha
        [sitekey]="sitekey" [language]="language" [test]="test" [visible]="visible"
        [hideShield]="hideShield" [shieldPosition]="shieldPosition"
        (success)="success($event)" (challengeVisible)="challengeVisible()"
        (challengeHidden)="challengeHidden()" (networkError)="networkError()"
        (javascriptError)="javascriptError($event)" />
    `,
  }),
};

export default meta;
type Story = StoryObj<InvisibleSmartCaptchaComponent>;

export const Default: Story = {};
