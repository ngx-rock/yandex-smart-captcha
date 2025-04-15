import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  forwardRef,
  Inject,
  input,
  OnDestroy,
  OnInit,
  output,
  PLATFORM_ID,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { isValidHost } from '../helpers/is-valid-host';
import {
  JavascriptErrorPayload,
  SmartCaptchaInstance,
  SmartCaptchaParams,
} from '../types';

const API_LINK = (host = 'smartcaptcha.yandexcloud.net') => {
  const base = /^https?/.test(host) ? host : `https://${host}`;
  return `${base}/captcha.js?render=onload&onload=__onSmartCaptchaReady`;
};

// Shared callbacks array
const callbacks: (() => void)[] = [];
export const startLoading = new Map<string, boolean>();

@Component({
  selector: 'smart-captcha',
  template: ` <div class="smart-captcha" #captchaContainer></div> `,
  styles: [
    `
      .smart-captcha {
        height: 102px;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SmartCaptchaComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SmartCaptchaComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class SmartCaptchaComponent
  implements ControlValueAccessor, Validator, OnInit, AfterViewInit, OnDestroy
{
  sitekey = input.required<string>();
  invisible = input<boolean>(false);
  visible = input<boolean>(); // For InvisibleCaptcha to execute
  hideShield = input<boolean>();
  shieldPosition = input<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >();
  language = input<string>();
  host = input<string>();
  /**
   * @deprecated This setting is deprecated and must only be changed via the Yandex Cloud interface.
   */
  theme = input<'light' | 'dark' | 'auto'>('auto');
  test = input<boolean>();
  webview = input<boolean>();

  challengeHidden = output<void>();
  challengeVisible = output<void>();
  success = output<string>();
  networkError = output<void>();
  tokenExpired = output<void>();
  javascriptError = output<JavascriptErrorPayload>();

  captchaContainer = viewChild<ElementRef<HTMLDivElement>>('captchaContainer');

  protected widgetId: number | undefined;
  protected smartCaptchaInstance: SmartCaptchaInstance | undefined;
  protected destroyed = false;
  private unsubscribeFns: Array<(() => void) | undefined> = [];
  private errorEventHandler: ((e: ErrorEvent) => void) | undefined;

  private onChange: (value: string | null) => void = () => {
    // onChange
  };
  private onTouched = () => {
    // onTouched
  };
  private _innerValue = signal<string | null>(null); // Use a signal for innerValue
  private callbackIndex: number | null = null;

  constructor(
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Effect for theme changes
    effect(() => {
      if (
        this.theme() &&
        this.widgetId !== undefined &&
        this.smartCaptchaInstance?.setTheme
      ) {
        this.smartCaptchaInstance.setTheme(this.widgetId, this.theme());
      }
    });

    // Effect for visible changes (Invisible Captcha)
    effect(() => {
      if (
        this.visible() &&
        this.invisible() &&
        this.smartCaptchaInstance &&
        typeof this.widgetId === 'number' &&
        !this.destroyed
      ) {
        this.smartCaptchaInstance.execute(this.widgetId);
      }
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Don't proceed on server-side
    }

    if (this.host() !== undefined && !isValidHost(this.host())) {
      console.error(
        `[SmartCaptcha] ${this.host()} host is invalid. It should be of a kind: domain.ru, localhost:3000`
      );
      return;
    }

    if (typeof window !== 'undefined') {
      // Setup global callback if not already defined
      if (window.__onSmartCaptchaReady === undefined) {
        window.__onSmartCaptchaReady = () => {
          callbacks.forEach((callback) => callback());
        };
      }

      // Check if SmartCaptcha is already loaded
      if (window.smartCaptcha) {
        this.smartCaptchaInstance = window.smartCaptcha;
      }

      // Add our callback to the shared array
      this.callbackIndex = callbacks.push(() => {
        this.smartCaptchaInstance = window.smartCaptcha;
        this.renderCaptcha();
      });

      // Load script if not already loading
      const hostKey = this.host() || 'default';
      if (!startLoading.get(hostKey)) {
        this.loadScript();
        startLoading.set(hostKey, true);
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.smartCaptchaInstance) {
      this.renderCaptcha();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    // Remove callback from shared array
    if (this.callbackIndex !== null) {
      callbacks.splice(this.callbackIndex - 1, 1);
    }

    // Destroy widget if it exists
    if (this.widgetId !== undefined && this.smartCaptchaInstance) {
      this.smartCaptchaInstance.destroy(this.widgetId);
      this.widgetId = undefined;
    }

    // Clean up subscriptions
    this.unsubscribeFns.forEach((fn) => fn && fn());
    this.unsubscribeFns = [];

    // Remove error event handler
    if (this.errorEventHandler && typeof window !== 'undefined') {
      window.removeEventListener('error', this.errorEventHandler);
    }
  }

  private loadScript(): void {
    const src = API_LINK(this.host());
    const script = this.renderer2.createElement('script');
    this.renderer2.setAttribute(script, 'src', src);
    this.renderer2.setAttribute(script, 'type', 'text/javascript');
    this.renderer2.setAttribute(script, 'crossOrigin', 'anonymous');

    // Handle regular onload/onerror
    script.onload = () => {
      if (window.smartCaptcha && !this.smartCaptchaInstance) {
        this.smartCaptchaInstance = window.smartCaptcha;
        this.renderCaptcha();
      }
    };

    script.onerror = () => {
      this.handleJavascriptError({
        filename: src,
        message: 'Unknown error on script loading',
        col: 0,
        line: 0,
      });
    };

    // Add error event listener for JS errors in the captcha script
    if (typeof window !== 'undefined') {
      this.errorEventHandler = (e: ErrorEvent) => {
        if (e.filename?.indexOf(src) === 0) {
          this.handleJavascriptError({
            filename: e.filename,
            message: e.message,
            col: e.colno,
            line: e.lineno,
          });
        }
      };
      window.addEventListener('error', this.errorEventHandler);
    }

    // Add script to document
    this.renderer2.appendChild(this.document.body, script);
  }

  private renderCaptcha(): void {
    const container = this.captchaContainer()?.nativeElement;
    if (
      !container ||
      !this.smartCaptchaInstance ||
      this.widgetId !== undefined ||
      this.destroyed
    ) {
      return;
    }

    const params: SmartCaptchaParams = {
      sitekey: this.sitekey(),
      hl: this.language(),
      theme: this.theme(),
      invisible: this.invisible(),
      hideShield: this.hideShield(),
      shieldPosition: this.shieldPosition(),
      test: this.test(),
      webview: this.webview(),
    };

    try {
      this.widgetId = this.smartCaptchaInstance.render(container, params);
      this.setupSubscriptions();
    } catch (error: unknown) {
      console.error('[SmartCaptcha] Error rendering captcha widget:', error);

      let message = 'Unknown error during rendering';
      if (error instanceof Error) {
        message = error.message;
      }

      this.handleJavascriptError({
        filename: API_LINK(this.host()),
        message,
        col: 0,
        line: 0,
      });
    }
  }

  private setupSubscriptions(): void {
    if (this.widgetId === undefined || !this.smartCaptchaInstance) {
      return;
    }

    // Store unsubscribe functions for cleanup
    this.unsubscribeFns = [
      this.smartCaptchaInstance.subscribe(
        this.widgetId,
        'challenge-visible',
        () => {
          this.challengeVisible.emit();
        }
      ),

      this.smartCaptchaInstance.subscribe(
        this.widgetId,
        'challenge-hidden',
        () => {
          console.error('hidden');
          this.challengeHidden.emit();
        }
      ),

      this.smartCaptchaInstance.subscribe(
        this.widgetId,
        'network-error',
        () => {
          this.networkError.emit();
        }
      ),

      this.smartCaptchaInstance.subscribe(
        this.widgetId,
        'success',
        (...args: unknown[]) => {
          const [token] = args as [string];

          this._innerValue.set(token);
          this.onChange(token);
          this.onTouched();
          this.success.emit(token);
        }
      ),

      this.smartCaptchaInstance.subscribe(
        this.widgetId,
        'token-expired',
        () => {
          this._innerValue.set(null);
          this.onChange(null);
          this.onTouched();
          this.tokenExpired.emit();
        }
      ),

      this.smartCaptchaInstance.subscribe(
        this.widgetId,
        'javascript-error',
        (...args: unknown[]) => {
          const [error] = args as [JavascriptErrorPayload];
          this.handleJavascriptError(error);
        }
      ),
    ];
  }

  private handleJavascriptError(error: JavascriptErrorPayload): void {
    console.error('[SmartCaptcha] Javascript error:', error);
    this.javascriptError.emit(error);
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this._innerValue.set(value); // Set the signal value
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // Validator method
  validate(): ValidationErrors | null {
    // When using invisible captcha, don't validate until user interacts
    if (this.invisible() && !this._innerValue()) {
      return null;
    }

    // For standard captcha, require token
    if (!this.invisible() && !this._innerValue()) {
      // Access signal value
      return { captchaRequired: true };
    }

    return null;
  }
}

@Component({
  selector: 'invisible-smart-captcha',
  template: ` <div class="smart-captcha" #captchaContainer></div> `,
  styles: [
    `
      .smart-captcha {
        /* No height needed for invisible captcha */
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InvisibleSmartCaptchaComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => InvisibleSmartCaptchaComponent),
      multi: true,
    },
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvisibleSmartCaptchaComponent
  extends SmartCaptchaComponent
  implements OnInit
{
  // Always set invisible to true
  override invisible = input(true);

  // Override ngOnInit to ensure invisible is always true
  override ngOnInit(): void {
    // Call parent initialization
    super.ngOnInit();
  }
}
