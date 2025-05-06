// Declare global window interface
export {};

declare global {
  interface Window {
    smartCaptcha: SmartCaptchaInstance;
    __onSmartCaptchaReady: () => void;
  }
}

// Define interface for window.smartCaptcha
export interface SmartCaptchaInstance {
  render: (container: HTMLElement, params: SmartCaptchaParams) => number;
  destroy: (widgetId: number) => void;
  subscribe: (
    widgetId: number,
    event: SmartCaptchaEvent,
    callback: (...args: unknown[]) => void
  ) => (() => void) | undefined;
  execute: (widgetId: number) => void;
  setTheme?: (widgetId: number, theme: 'light' | 'dark' | 'auto') => void;
}

export interface SmartCaptchaParams {
  sitekey: string;
  hl?: string;
  theme?: 'light' | 'dark' | 'auto';
  invisible?: boolean;
  hideShield?: boolean;
  shieldPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  test?: boolean;
  webview?: boolean;
}

type SmartCaptchaEvent =
  | 'challenge-visible'
  | 'challenge-hidden'
  | 'network-error'
  | 'success'
  | 'token-expired'
  | 'javascript-error';

export interface JavascriptErrorPayload {
  filename: string;
  message: string;
  col: number;
  line: number;
}
