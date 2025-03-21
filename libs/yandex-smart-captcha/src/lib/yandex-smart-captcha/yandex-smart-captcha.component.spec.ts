import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import {
  InvisibleSmartCaptchaComponent,
  SmartCaptchaComponent,
  startLoading,
} from './';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

describe('SmartCaptchaComponent', () => {
  let component: SmartCaptchaComponent;
  let fixture: ComponentFixture<SmartCaptchaComponent>;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockSmartCaptchaInstance: any;
  let mockDocument: Document;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let captchaContainer: DebugElement;

  beforeEach(async () => {
    // Mock the SmartCaptcha global instance
    mockSmartCaptchaInstance = {
      render: jest.fn().mockReturnValue(1), // Returns a widget ID of 1
      destroy: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      subscribe: jest.fn().mockReturnValue(() => {}), // Returns an unsubscribe function
      execute: jest.fn(),
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
      imports: [SmartCaptchaComponent, FormsModule, ReactiveFormsModule],
      providers: [
        {
          provide: DOCUMENT,
          useValue: document,
        },
      ],
    }).compileComponents();

    mockDocument = TestBed.inject(DOCUMENT);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SmartCaptchaComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sitekey', 'test-site-key');
    captchaContainer = fixture.debugElement.query(By.css('.smart-captcha'));
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
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
    TestBed.flushEffects();
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

    expect(consoleErrorSpy).toHaveBeenCalled();

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

  it('should handle script loading errors', fakeAsync(() => {
    // Test private method for error handling
    const jsErrorSpy = jest.spyOn(component.javascriptError, 'emit');

    // Mock the script element
    const mockScript = document.createElement('script');
    jest
      .spyOn(component['renderer2'], 'createElement')
      .mockReturnValue(mockScript);
    jest
      .spyOn(component['renderer2'], 'appendChild')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

    // Force script load error
    component['loadScript']();
    (mockScript as any).onerror();

    expect(jsErrorSpy).toHaveBeenCalled();
    expect(jsErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Unknown error on script loading',
      })
    );
  }));

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

  it('should load script if smartCaptcha is not available', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete (window as any).smartCaptcha;

    startLoading.clear();

    const loadScriptSpy = jest.spyOn(component as any, 'loadScript');

    component.ngOnInit();

    expect(loadScriptSpy).toHaveBeenCalled();
  });

  it('should not load script if already loading for same host', () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete (window as any).smartCaptcha;
    startLoading.clear();

    const loadScriptSpy = jest.spyOn(component as any, 'loadScript');

    // First time should call loadScript
    component.ngOnInit();
    expect(loadScriptSpy).toHaveBeenCalled();

    loadScriptSpy.mockClear();

    // Create a new component with the same host
    const newComponent = TestBed.createComponent(
      SmartCaptchaComponent
    ).componentInstance;
    fixture.componentRef.setInput('sitekey', 'test-site-key');

    // Second time should not call loadScript
    newComponent.ngOnInit();
    expect(loadScriptSpy).not.toHaveBeenCalled();
  });
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
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      subscribe: jest.fn().mockReturnValue(() => {}),
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

  it('should execute captcha when visible input changes to true', fakeAsync(() => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    TestBed.flushEffects();
    tick();

    expect(mockSmartCaptchaInstance.execute).toHaveBeenCalledWith(1);
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
    const consoleSpy = jest
      .spyOn(console, 'error')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});

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

    expect(consoleSpy).toHaveBeenCalled();
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
