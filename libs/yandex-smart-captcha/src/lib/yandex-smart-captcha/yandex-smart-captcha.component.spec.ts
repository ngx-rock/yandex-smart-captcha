import { Component, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { By } from '@angular/platform-browser';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  InvisibleSmartCaptchaComponent,
  SmartCaptchaComponent,
  startLoading,
} from '../../index';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

@Component({
  imports: [ReactiveFormsModule, SmartCaptchaComponent],
  template: `
    <form>
      <smart-captcha [sitekey]="sitekey()" [invisible]="invisible()" [formControl]="captcha" />
      <button type="submit" [disabled]="captcha.invalid">Submit</button>
    </form>
  `,
})
class CaptchaForm {
  readonly sitekey = signal('test-site-key');
  readonly invisible = signal(false);
  readonly captcha = new FormControl<string | null>(null);
}

describe('SmartCaptchaComponent', () => {
  let component: SmartCaptchaComponent;
  let fixture: ComponentFixture<SmartCaptchaComponent>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockSmartCaptchaInstance: any;

  beforeEach(async () => {
    // Mock the SmartCaptcha global instance
    mockSmartCaptchaInstance = {
      render: jest.fn().mockReturnValue(1), // Returns a widget ID of 1
      destroy: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      subscribe: jest.fn().mockReturnValue(() => {}), // Returns an unsubscribe function
      execute: jest.fn(),
      reset: jest.fn(),
      setTheme: jest.fn(),
    };

    // Setup the window object with our mock
    Object.defineProperty(window, 'smartCaptcha', {
      value: mockSmartCaptchaInstance,
      writable: true,
    });

    // Add the callback function
    Object.defineProperty(window, '__onSmartCaptchaReady', {
      value: jest.fn(),
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [
        SmartCaptchaComponent,
        FormsModule,
        ReactiveFormsModule,
        CaptchaForm,
      ],
      providers: [
        {
          provide: DOCUMENT,
          useValue: document,
        },
      ],
    }).compileComponents();

  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmartCaptchaComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sitekey', 'test-site-key');
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it.each([
    ['language', 'ru', { hl: 'ru' }],
    ['sitekey', 'new-site-key', { sitekey: 'new-site-key' }],
    ['test', true, { test: true }],
    ['webview', true, { webview: true }],
  ])('recreates the standard widget when %s changes', (input, value, params) => {
    mockSmartCaptchaInstance.render.mockReturnValueOnce(2);
    fixture.componentRef.setInput(input, value);
    fixture.detectChanges();

    expect(mockSmartCaptchaInstance.destroy).toHaveBeenCalledWith(1);
    expect(mockSmartCaptchaInstance.render).toHaveBeenCalledTimes(2);
    expect(mockSmartCaptchaInstance.render).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining(params)
    );
    expect(mockSmartCaptchaInstance.subscribe).toHaveBeenCalledWith(
      2,
      'success',
      expect.any(Function)
    );
    expect(mockSmartCaptchaInstance.execute).not.toHaveBeenCalled();
  });

  it('clears the previous widget token from the Angular form on recreation', () => {
    fixture.destroy();
    mockSmartCaptchaInstance.render.mockReturnValueOnce(2);
    const form = TestBed.createComponent(CaptchaForm);
    form.detectChanges();
    const submit = form.debugElement.query(By.css('button'))
      .nativeElement as HTMLButtonElement;
    const success = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      ([id, event]: [number, string]) => id === 2 && event === 'success'
    )[2];
    success('old-token');
    form.changeDetectorRef.markForCheck();
    form.detectChanges();
    expect(form.componentInstance.captcha.value).toBe('old-token');
    expect(submit.disabled).toBe(false);

    mockSmartCaptchaInstance.render.mockReturnValueOnce(3);
    form.componentInstance.sitekey.set('new-site-key');
    form.detectChanges();

    expect(form.componentInstance.captcha.value).toBeNull();
    expect(submit.disabled).toBe(true);
  });

  it('resets the widget when its Angular form control is reset', () => {
    fixture.destroy();
    mockSmartCaptchaInstance.render.mockReturnValueOnce(2);
    const form = TestBed.createComponent(CaptchaForm);
    form.detectChanges();
    const success = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      ([id, event]: [number, string]) => id === 2 && event === 'success'
    )[2];
    success('solved-token');

    form.componentInstance.captcha.reset();
    form.detectChanges();

    expect(mockSmartCaptchaInstance.reset).toHaveBeenCalledWith(2);
    expect(form.componentInstance.captcha.value).toBeNull();
    expect(form.componentInstance.captcha.invalid).toBe(true);
  });

  it('revalidates the form when switching between standard and invisible modes', () => {
    fixture.destroy();
    const form = TestBed.createComponent(CaptchaForm);
    form.detectChanges();
    expect(form.componentInstance.captcha.errors).toEqual({ captchaRequired: true });

    form.componentInstance.invisible.set(true);
    form.detectChanges();
    expect(form.componentInstance.captcha.valid).toBe(true);

    form.componentInstance.invisible.set(false);
    form.detectChanges();
    expect(form.componentInstance.captcha.errors).toEqual({ captchaRequired: true });
  });

  it('should render captcha after view init', fakeAsync(() => {
    component.ngAfterViewInit();
    tick();
    expect(mockSmartCaptchaInstance.render).toHaveBeenCalled();
    expect(component['widgetId']).toBe(1);
  }));

  it('should setup subscriptions when rendering captcha', fakeAsync(() => {
    component.ngAfterViewInit();
    tick();

    // Should subscribe to 6 events
    expect(mockSmartCaptchaInstance.subscribe).toHaveBeenCalledTimes(6);
    expect(mockSmartCaptchaInstance.subscribe).toHaveBeenCalledWith(
      1,
      'challenge-visible',
      expect.any(Function)
    );
    expect(mockSmartCaptchaInstance.subscribe).toHaveBeenCalledWith(
      1,
      'challenge-hidden',
      expect.any(Function)
    );
    expect(mockSmartCaptchaInstance.subscribe).toHaveBeenCalledWith(
      1,
      'network-error',
      expect.any(Function)
    );
    expect(mockSmartCaptchaInstance.subscribe).toHaveBeenCalledWith(
      1,
      'success',
      expect.any(Function)
    );
    expect(mockSmartCaptchaInstance.subscribe).toHaveBeenCalledWith(
      1,
      'token-expired',
      expect.any(Function)
    );
    expect(mockSmartCaptchaInstance.subscribe).toHaveBeenCalledWith(
      1,
      'javascript-error',
      expect.any(Function)
    );
  }));

  it('should destroy captcha when component is destroyed', fakeAsync(() => {
    // First render the captcha
    component.ngAfterViewInit();
    tick();
    expect(component['widgetId']).toBe(1);

    // Then destroy the component
    component.ngOnDestroy();
    expect(mockSmartCaptchaInstance.destroy).toHaveBeenCalledWith(1);
    expect(component['widgetId']).toBeUndefined();
  }));

  it('should clean up subscriptions on destroy', fakeAsync(() => {
    component.ngAfterViewInit();
    tick();

    expect(component['unsubscribeFns'].length).toBe(6);

    component.ngOnDestroy();

    expect(component['unsubscribeFns']).toEqual([]);
  }));

  it('should execute captcha when visible is true and invisible is true', fakeAsync(() => {
    fixture.componentRef.setInput('invisible', true);
    component.ngAfterViewInit();
    tick();
    fixture.componentRef.setInput('visible', true);

    fixture.detectChanges();
    TestBed.tick();
    tick();

    expect(mockSmartCaptchaInstance.execute).toHaveBeenCalledWith(1);
  }));

  it('should not execute captcha when visible is true but invisible is false', fakeAsync(() => {
    fixture.componentRef.setInput('invisible', false);
    component.ngAfterViewInit();
    tick();

    fixture.componentRef.setInput('visible', true);
    tick();

    expect(mockSmartCaptchaInstance.execute).not.toHaveBeenCalled();
  }));

  it('should emit events when callbacks are triggered', fakeAsync(() => {
    const challengeVisibleSpy = jest.spyOn(component.challengeVisible, 'emit');
    const challengeHiddenSpy = jest.spyOn(component.challengeHidden, 'emit');
    const networkErrorSpy = jest.spyOn(component.networkError, 'emit');
    const tokenExpiredSpy = jest.spyOn(component.tokenExpired, 'emit');
    const successSpy = jest.spyOn(component.success, 'emit');
    const jsErrorSpy = jest.spyOn(component.javascriptError, 'emit');

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    // Setup component and get the callback functions
    component.ngAfterViewInit();
    tick();

    // Get the callback functions from the subscribe calls
    const challengeVisibleCallback =
      mockSmartCaptchaInstance.subscribe.mock.calls.find(
        (call: unknown[]) => call[1] === 'challenge-visible'
      )[2];

    const challengeHiddenCallback =
      mockSmartCaptchaInstance.subscribe.mock.calls.find(
        (call: unknown[]) => call[1] === 'challenge-hidden'
      )[2];

    const networkErrorCallback =
      mockSmartCaptchaInstance.subscribe.mock.calls.find(
        (call: unknown[]) => call[1] === 'network-error'
      )[2];

    const successCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'success'
    )[2];

    const tokenExpiredCallback =
      mockSmartCaptchaInstance.subscribe.mock.calls.find(
        (call: unknown[]) => call[1] === 'token-expired'
      )[2];

    const jsErrorCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'javascript-error'
    )[2];

    // Trigger callbacks
    challengeVisibleCallback();
    expect(challengeVisibleSpy).toHaveBeenCalled();

    challengeHiddenCallback();
    expect(challengeHiddenSpy).toHaveBeenCalled();

    networkErrorCallback();
    expect(networkErrorSpy).toHaveBeenCalled();

    successCallback('token-123');
    expect(successSpy).toHaveBeenCalledWith('token-123');

    tokenExpiredCallback();
    expect(tokenExpiredSpy).toHaveBeenCalled();

    jsErrorCallback({ filename: 'test.js', message: 'error', col: 0, line: 0 });
    expect(jsErrorSpy).toHaveBeenCalledWith({
      filename: 'test.js',
      message: 'error',
      col: 0,
      line: 0,
    });
    consoleErrorSpy.mockRestore();
  }));

  it('should update value when success callback is triggered', fakeAsync(() => {
    const onChangeSpy = jest.fn();
    const onTouchedSpy = jest.fn();

    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    component.ngAfterViewInit();
    tick();

    // Find and trigger the success callback
    const successCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'success'
    )[2];

    successCallback('token-123');

    expect(component['_innerValue']()).toBe('token-123');
    expect(onChangeSpy).toHaveBeenCalledWith('token-123');
    expect(onTouchedSpy).toHaveBeenCalled();
  }));

  it('should reset value when token-expired callback is triggered', fakeAsync(() => {
    const onChangeSpy = jest.fn();
    const onTouchedSpy = jest.fn();

    component.registerOnChange(onChangeSpy);
    component.registerOnTouched(onTouchedSpy);

    // First set a value
    component.writeValue('token-123');
    expect(component['_innerValue']()).toBe('token-123');

    component.ngAfterViewInit();
    tick();

    // Find and trigger the token-expired callback
    const tokenExpiredCallback =
      mockSmartCaptchaInstance.subscribe.mock.calls.find(
        (call: unknown[]) => call[1] === 'token-expired'
      )[2];

    tokenExpiredCallback();

    expect(component['_innerValue']()).toBe(null);
    expect(onChangeSpy).toHaveBeenCalledWith(null);
    expect(onTouchedSpy).toHaveBeenCalled();
  }));

  it('should validate correctly for non-invisible captcha', () => {
    fixture.componentRef.setInput('invisible', false);
    // No token - should fail validation
    component.writeValue('');
    expect(component.validate()).toEqual({ captchaRequired: true });

    // With token - should pass validation
    component.writeValue('token-123');
    expect(component.validate()).toBeNull();
  });

  it('should not validate for invisible captcha until user interacts', () => {
    fixture.componentRef.setInput('invisible', true);

    // No token - should still pass validation for invisible captcha
    component.writeValue('');
    expect(component.validate()).toBeNull();

    // With token - should pass validation
    component.writeValue('token-123');
    expect(component.validate()).toBeNull();
  });

  it('should handle render errors by calling handleJavascriptError', fakeAsync(() => {
    // Set up all spies at the beginning
    const handleErrorSpy = jest.spyOn(
      component as any,
      'handleJavascriptError'
    );
    const jsErrorSpy = jest.spyOn(component.javascriptError, 'emit');
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    // Override render to throw an error
    mockSmartCaptchaInstance.render.mockImplementation(() => {
      throw new Error('Render error');
    });

    // Prepare component state
    component['widgetId'] = undefined;

    // Trigger render
    component['renderCaptcha']();
    tick();

    // Verify internal error handling
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Render error',
      })
    );

    // Verify external behavior
    expect(jsErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Verify component state remains correct
    expect(component['widgetId']).toBeUndefined();

    // Clean up
    consoleErrorSpy.mockRestore();
  }));

});

describe('invisible captcha with a delayed API', () => {
  let fixture: ComponentFixture<InvisibleSmartCaptchaComponent>;
  let api: {
    render: jest.Mock;
    destroy: jest.Mock;
    subscribe: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(async () => {
    api = {
      render: jest.fn().mockReturnValue(42),
      destroy: jest.fn(),
      subscribe: jest.fn().mockReturnValue(jest.fn()),
      execute: jest.fn(),
    };
    window.smartCaptcha = undefined as unknown as Window['smartCaptcha'];
    window.__onSmartCaptchaReady =
      undefined as unknown as Window['__onSmartCaptchaReady'];
    startLoading.clear();
    await TestBed.configureTestingModule({
      imports: [InvisibleSmartCaptchaComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(InvisibleSmartCaptchaComponent);
    fixture.componentRef.setInput('sitekey', 'test-site-key');
  });

  afterEach(() => {
    fixture.destroy();
    captchaScripts().forEach((script) => script.remove());
    startLoading.clear();
    jest.restoreAllMocks();
  });

  function loadApi(): void {
    window.smartCaptcha = api as unknown as Window['smartCaptcha'];
    window.__onSmartCaptchaReady();
    TestBed.tick();
  }

  function createCaptcha(key: string): ComponentFixture<InvisibleSmartCaptchaComponent> {
    const captcha = TestBed.createComponent(InvisibleSmartCaptchaComponent);
    captcha.componentRef.setInput('sitekey', key);
    captcha.detectChanges();
    return captcha;
  }

  function captchaScripts(): HTMLScriptElement[] {
    return [...document.querySelectorAll<HTMLScriptElement>('script[src*="captcha.js?"]')];
  }

  it('keeps the remaining listener when earlier widgets are destroyed out of order', () => {
    fixture.detectChanges();
    const second = createCaptcha('second-key');
    createCaptcha('third-key');
    fixture.destroy();
    second.destroy();

    loadApi();

    expect(api.render).toHaveBeenCalledTimes(1);
    expect(api.render).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ sitekey: 'third-key' })
    );
  });

  it('notifies all waiting widgets and allows the next mount to retry a failed load', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const firstError = jest.fn();
    const secondError = jest.fn();
    const baseline = captchaScripts().length;
    fixture.componentInstance.javascriptError.subscribe(firstError);
    fixture.detectChanges();
    const second = createCaptcha('second-key');
    second.componentInstance.javascriptError.subscribe(secondError);
    expect(captchaScripts()).toHaveLength(baseline + 1);

    captchaScripts().at(-1)?.dispatchEvent(new Event('error'));
    expect(firstError).toHaveBeenCalledTimes(1);
    expect(secondError).toHaveBeenCalledTimes(1);
    createCaptcha('retry-key');
    expect(captchaScripts()).toHaveLength(baseline + 1);

    loadApi();
    expect(api.render).toHaveBeenCalledTimes(3);
    expect(api.render).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ sitekey: 'second-key' })
    );
    expect(api.render).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ sitekey: 'retry-key' })
    );
  });

  it('renders all waiting widgets on script load if another integration owns the global callback', () => {
    window.__onSmartCaptchaReady = jest.fn();
    fixture.detectChanges();
    createCaptcha('second-key');
    const script = captchaScripts().at(-1);
    window.smartCaptcha = api as unknown as Window['smartCaptcha'];

    script?.dispatchEvent(new Event('load'));
    expect(api.render).toHaveBeenCalledTimes(2);

    createCaptcha('preloaded-key');
    expect(captchaScripts().at(-1)).toBe(script);
    expect(captchaScripts()).toHaveLength(1);
    expect(api.render).toHaveBeenCalledTimes(3);
  });

  it('adds HTTPS to a bare proxy host that starts with http', () => {
    fixture.componentRef.setInput('host', 'http-proxy.example.com');
    fixture.detectChanges();

    expect(captchaScripts().at(-1)?.src).toBe(
      'https://http-proxy.example.com/captcha.js?render=onload&onload=__onSmartCaptchaReady'
    );
  });

  it('executes once when visible is initially true before the API loads', fakeAsync(() => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.tick();
    expect(api.execute).not.toHaveBeenCalled();

    loadApi();
    tick();
    expect(api.execute).toHaveBeenCalledTimes(1);
    expect(api.execute).toHaveBeenCalledWith(42);
    fixture.detectChanges();
    TestBed.tick();
    expect(api.execute).toHaveBeenCalledTimes(1);
  }));

  it('executes when visible becomes true while the API is loading', fakeAsync(() => {
    fixture.detectChanges();
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.tick();
    loadApi();
    tick();
    expect(api.execute).toHaveBeenCalledTimes(1);
    expect(api.execute).toHaveBeenCalledWith(42);
  }));

  it('does not execute if visibility is cancelled before the API loads', fakeAsync(() => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.tick();
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    TestBed.tick();
    loadApi();
    tick();
    expect(api.execute).not.toHaveBeenCalled();
  }));

  it('executes again after visibility switches off and on', fakeAsync(() => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.tick();
    loadApi();
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    TestBed.tick();
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.tick();
    tick();
    expect(api.execute).toHaveBeenCalledTimes(2);
  }));
});

describe('InvisibleSmartCaptchaComponent', () => {
  let component: InvisibleSmartCaptchaComponent;
  let fixture: ComponentFixture<InvisibleSmartCaptchaComponent>;
  let mockSmartCaptchaInstance: any;

  beforeEach(async () => {
    // Mock the SmartCaptcha global instance
    mockSmartCaptchaInstance = {
      render: jest.fn().mockReturnValue(1),
      destroy: jest.fn(),
      subscribe: jest.fn().mockReturnValue(jest.fn()),
      execute: jest.fn(),
      setTheme: jest.fn(),
    };

    Object.defineProperty(window, 'smartCaptcha', {
      value: mockSmartCaptchaInstance,
      writable: true,
    });

    // Add the callback function
    Object.defineProperty(window, '__onSmartCaptchaReady', {
      value: jest.fn(),
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [
        InvisibleSmartCaptchaComponent,
        FormsModule,
        ReactiveFormsModule,
      ],
      providers: [
        {
          provide: DOCUMENT,
          useValue: document,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvisibleSmartCaptchaComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sitekey', 'test-site-key');
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have invisible set to true', () => {
    expect(component.invisible()).toBe(true);
  });

  it('starts the replacement widget once when its settings change while visible', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    expect(mockSmartCaptchaInstance.execute).toHaveBeenCalledWith(1);
    const subscribe = mockSmartCaptchaInstance.subscribe;
    const unsubscribe = subscribe.mock.results[0].value;
    mockSmartCaptchaInstance.render.mockReturnValueOnce(2);
    subscribe.mockReturnValue(jest.fn());

    fixture.componentRef.setInput('hideShield', true);
    fixture.componentRef.setInput('shieldPosition', 'center-left');
    fixture.detectChanges();

    expect(mockSmartCaptchaInstance.destroy).toHaveBeenCalledWith(1);
    expect(unsubscribe).toHaveBeenCalledTimes(6);
    expect(mockSmartCaptchaInstance.render).toHaveBeenCalledTimes(2);
    expect(mockSmartCaptchaInstance.render).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ hideShield: true, shieldPosition: 'center-left' })
    );
    expect(mockSmartCaptchaInstance.execute.mock.calls).toEqual([[1], [2]]);
    expect(subscribe.mock.invocationCallOrder.at(-1)).toBeLessThan(
      mockSmartCaptchaInstance.execute.mock.invocationCallOrder[1]
    );
  });

  it('applies the new settings before starting a challenge in the same update', () => {
    mockSmartCaptchaInstance.render.mockReturnValueOnce(2);
    fixture.componentRef.setInput('shieldPosition', 'center-right');
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();

    expect(mockSmartCaptchaInstance.execute.mock.calls).toEqual([[2]]);
  });

  it('applies a theme update to the existing widget', () => {
    fixture.componentRef.setInput('theme', 'dark');
    fixture.detectChanges();

    expect(mockSmartCaptchaInstance.setTheme).toHaveBeenCalledWith(1, 'dark');
    expect(mockSmartCaptchaInstance.render).toHaveBeenCalledTimes(1);
  });

  it('should execute captcha when visible input changes to true', fakeAsync(() => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.tick();
    tick();

    expect(mockSmartCaptchaInstance.execute).toHaveBeenCalledWith(1);
  }));

  it('executes once when visible is true during initial render with an already loaded API', fakeAsync(() => {
    const initiallyVisible = TestBed.createComponent(InvisibleSmartCaptchaComponent);
    initiallyVisible.componentRef.setInput('sitekey', 'test-site-key');
    initiallyVisible.componentRef.setInput('visible', true);
    initiallyVisible.detectChanges();
    TestBed.tick();
    tick();

    expect(mockSmartCaptchaInstance.execute).toHaveBeenCalledTimes(1);
    expect(mockSmartCaptchaInstance.execute).toHaveBeenCalledWith(1);
    initiallyVisible.destroy();
  }));

  it('should handle validation correctly for invisible mode', () => {
    // Even without a token, validation should initially pass for invisible captcha
    expect(component.validate()).toBeNull();

    // After setting a token, validation should still pass
    component.writeValue('token-123');
    expect(component.validate()).toBeNull();
  });

  it('should emit success event with token when successful', fakeAsync(() => {
    const successSpy = jest.spyOn(component.success, 'emit');

    component.ngAfterViewInit();
    tick();

    // Find the success callback
    const successCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'success'
    )[2];

    // Trigger success callback with token
    successCallback('invisible-token-123');

    expect(successSpy).toHaveBeenCalledWith('invisible-token-123');
    expect(component['_innerValue']()).toBe('invisible-token-123');
  }));

  it('should work with Angular Forms', fakeAsync(() => {
    // Create a form with the component
    const form = new FormGroup({
      captcha: new FormControl(''),
    });

    // Register with form control
    const control = form.get('captcha');
    component.registerOnChange((value) => control?.setValue(value));
    component.registerOnTouched(() => control?.markAsTouched());

    component.ngAfterViewInit();
    tick();

    // Find the success callback
    const successCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'success'
    )[2];

    // Trigger success with token
    successCallback('form-token-123');

    expect(control?.value).toBe('form-token-123');
    expect(component['_innerValue']()).toBe('form-token-123');
  }));

  it('should reset form value when token expires', fakeAsync(() => {
    // Setup form integration
    const form = new FormGroup({
      captcha: new FormControl('initial-token'),
    });

    const control = form.get('captcha');
    component.registerOnChange((value) => control?.setValue(value));
    component.registerOnTouched(() => control?.markAsTouched());

    // Set initial value
    component.writeValue('initial-token');

    component.ngAfterViewInit();
    tick();

    // Find token-expired callback
    const expiredCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'token-expired'
    )[2];

    // Trigger token expiration
    expiredCallback();

    expect(control?.value).toBeNull();
    expect(component['_innerValue']()).toBeNull();
  }));

  it('should emit challenge events correctly', fakeAsync(() => {
    const visibleSpy = jest.spyOn(component.challengeVisible, 'emit');
    const hiddenSpy = jest.spyOn(component.challengeHidden, 'emit');

    component.ngAfterViewInit();
    tick();

    // Find challenge event callbacks
    const visibleCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'challenge-visible'
    )[2];

    const hiddenCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'challenge-hidden'
    )[2];

    // Trigger events
    visibleCallback();
    hiddenCallback();

    expect(visibleSpy).toHaveBeenCalled();
    expect(hiddenSpy).toHaveBeenCalled();
  }));

  it('should emit network error events', fakeAsync(() => {
    const networkErrorSpy = jest.spyOn(component.networkError, 'emit');

    component.ngAfterViewInit();
    tick();

    // Find network error callback
    const errorCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'network-error'
    )[2];

    // Trigger network error
    errorCallback();

    expect(networkErrorSpy).toHaveBeenCalled();
  }));

  it('should handle Javascript errors properly', fakeAsync(() => {
    const jsErrorSpy = jest.spyOn(component.javascriptError, 'emit');
    const consoleSpy = jest
      .spyOn(console, 'error')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    component.ngAfterViewInit();
    tick();

    // Find JS error callback
    const errorCallback = mockSmartCaptchaInstance.subscribe.mock.calls.find(
      (call: unknown[]) => call[1] === 'javascript-error'
    )[2];

    const errorPayload = {
      filename: 'captcha.js',
      message: 'Test error message',
      col: 10,
      line: 20,
    };

    // Trigger JS error
    errorCallback(errorPayload);

    expect(jsErrorSpy).toHaveBeenCalledWith(errorPayload);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  }));
});
