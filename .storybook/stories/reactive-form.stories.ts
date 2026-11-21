import type { Meta, StoryObj } from '@storybook/angular';
import { CaptchaFormDemoComponent } from './captcha-form-demo.component';

const meta: Meta<CaptchaFormDemoComponent> = {
  title: 'Examples/Forms',
  component: CaptchaFormDemoComponent,
  parameters: { layout: 'fullscreen', options: { showPanel: false } },
  argTypes: { mode: { control: false } },
};

export default meta;
type Story = StoryObj<CaptchaFormDemoComponent>;

export const SignUp: Story = {
  name: 'Sign up · visible captcha',
  args: { mode: 'standard' },
};

export const Contact: Story = {
  name: 'Contact form · invisible captcha',
  args: { mode: 'invisible' },
};
