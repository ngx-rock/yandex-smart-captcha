import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  PLATFORM_ID,
  Renderer2,
  signal,
  SimpleChanges,
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
import { HTTP_PROTOCOL, isValidHost } from '../helpers/is-valid-host';
import {
  JavascriptErrorPayload,
  SmartCaptchaInstance,
  SmartCaptchaParams,
} from '../types';

const API_LINK = (host = 'smartcaptcha.cloud.yandex.ru') => {
  const base = HTTP_PROTOCOL.test(host) ? host : `https://${host}`;
  return `${base}/captcha.js?render=onload&onload=__onSmartCaptchaReady`;
};

interface CaptchaLoadListener {
  ready: (api: SmartCaptchaInstance) => void;
  error: (error: JavascriptErrorPayload) => void;
}

const pendingLoads = new Map<string, Set<CaptchaLoadListener>>();
export const startLoading = new Map<string, boolean>();

function notifyApiReady(): void {
  const api = window.smartCaptcha;
  if (!api) return;

  const groups = [...pendingLoads.values()];
  pendingLoads.clear();
  for (const group of groups) {
    group.forEach((listener) => listener.ready(api));
  }
}

@Component({
  selector: 'smart-captcha',
  templateUrl: './captcha-container.html',
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
  implements
    ControlValueAccessor,
    Validator,
    OnInit,
    OnChanges,
    AfterViewInit,
    OnDestroy
{
  sitekey = input.required<string>();
  invisible = input<boolean>(false);
  visible = input<boolean>(); // For InvisibleCaptcha to execute
  hideShield = input<boolean>();
  shieldPosition = input<SmartCaptchaParams['shieldPosition']>();
  language = input<SmartCaptchaParams['hl']>();
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

  private readonly renderer2 = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

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
  private readonly _innerValue = signal<string | null>(null);
  private removeLoadListener?: () => void;
  private onValidatorChange?: () => void;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['invisible']) {
      this.onValidatorChange?.();
    }

    if (!this.smartCaptchaInstance || this.destroyed) {
      return;
    }
    if (
      changes['sitekey'] ||
      changes['language'] ||
      changes['test'] ||
      changes['webview'] ||
      changes['invisible'] ||
      (this.invisible() && (changes['hideShield'] || changes['shieldPosition']))
    ) {
      if (this.widgetId !== undefined) {
        this.destroyWidget();
        if (this._innerValue() !== null) {
          this._innerValue.set(null);
          this.onChange(null);
        }
      }
      this.renderCaptcha();
      return;
    }

    if (changes['theme'] && this.theme() && this.widgetId !== undefined) {
      this.smartCaptchaInstance.setTheme?.(this.widgetId, this.theme());
    }
    if (changes['visible']) {
      this.executeWhenVisible();
    }
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined') {
      return;
    }

    const host = this.host();
    if (host !== undefined && !isValidHost(host)) {
      console.error(
        `[SmartCaptcha] ${host} host is invalid. It should be of a kind: domain.ru, localhost:3000`
      );
      return;
    }

    if (window.smartCaptcha) {
      this.smartCaptchaInstance = window.smartCaptcha;
      return;
    }

    window.__onSmartCaptchaReady ??= notifyApiReady;

    const hostKey = host || 'default';
    const src = API_LINK(host);
    const listeners = pendingLoads.get(hostKey) ?? new Set<CaptchaLoadListener>();
    const listener: CaptchaLoadListener = {
      ready: (api) => {
        this.removeLoadListener = undefined;
        this.smartCaptchaInstance = api;
        this.renderCaptcha();
      },
      error: (error) => this.handleJavascriptError(error),
    };
    listeners.add(listener);
    pendingLoads.set(hostKey, listeners);
    this.removeLoadListener = () => {
      listeners.delete(listener);
      if (listeners.size === 0 && pendingLoads.get(hostKey) === listeners) {
        pendingLoads.delete(hostKey);
      }
    };

    this.errorEventHandler = (event) => {
      if (event.filename === src) {
        this.handleJavascriptError({
          filename: event.filename,
          message: event.message,
          col: event.colno,
          line: event.lineno,
        });
      }
    };
    window.addEventListener('error', this.errorEventHandler);

    if (!startLoading.get(hostKey)) {
      startLoading.set(hostKey, true);
      this.loadScript(hostKey, src);
    }
  }

  ngAfterViewInit(): void {
    if (this.smartCaptchaInstance) {
      this.renderCaptcha();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    this.removeLoadListener?.();
    this.destroyWidget();

    // Remove error event handler
    if (this.errorEventHandler && typeof window !== 'undefined') {
      window.removeEventListener('error', this.errorEventHandler);
    }
  }

  private destroyWidget(): void {
    this.unsubscribeFns.forEach((unsubscribe) => unsubscribe?.());
    this.unsubscribeFns = [];
    if (this.widgetId !== undefined) {
      this.smartCaptchaInstance?.destroy(this.widgetId);
      this.widgetId = undefined;
    }
  }

  private executeWhenVisible(): void {
    if (this.visible() && this.invisible() && typeof this.widgetId === 'number') {
      this.smartCaptchaInstance?.execute(this.widgetId);
    }
  }

  private loadScript(hostKey: string, src: string): void {
    const script: HTMLScriptElement = this.renderer2.createElement('script');
    this.renderer2.setAttribute(script, 'src', src);
    this.renderer2.setAttribute(script, 'type', 'text/javascript');
    this.renderer2.setAttribute(script, 'crossOrigin', 'anonymous');

    script.onload = notifyApiReady;
    script.onerror = () => {
      startLoading.delete(hostKey);
      script.remove();
      const listeners = pendingLoads.get(hostKey);
      if (!listeners) return;

      const error = {
        filename: src,
        message: 'Unknown error on script loading',
        col: 0,
        line: 0,
      };
      for (const listener of [...listeners]) {
        if (listeners.has(listener)) listener.error(error);
      }
    };
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
      this.executeWhenVisible();
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
  writeValue(value: string | null): void {
    this._innerValue.set(value);
    if (value === null && this.widgetId !== undefined) {
      this.smartCaptchaInstance?.reset?.(this.widgetId);
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  validate(): ValidationErrors | null {
    return !this.invisible() && !this._innerValue() ? { captchaRequired: true } : null;
  }
}
