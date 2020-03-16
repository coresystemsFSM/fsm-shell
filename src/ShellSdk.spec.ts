
import { ShellSdk } from './ShellSdk';
import { SHELL_EVENTS } from './ShellEvents';
import * as sinon from 'sinon';

describe('Shell Sdk', () => {

  let sdk: ShellSdk;
  let sdkTarget: any;
  let sdkOrigin: string;
  let data: any;

  let windowMock: any;
  let windowMockEventListenerAdded: boolean;
  let windowMockEventType: string;
  let windowMockCallback: Function;

  beforeEach(() => {
    windowMock = {
      addEventListener: (eventType, callback) => {
        windowMockEventListenerAdded = true;
        windowMockEventType = eventType;
        windowMockCallback = callback
      }
    }

    sdkOrigin = 'fsm-sdk.net';

    sdkTarget = {
      postMessage: sinon.stub()
    };
    data = { message: 'test' };
  });

  it('should create instance', () => {
    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);
    expect(sdk).toBeDefined();
  });

  it('should create instance as Root', () => {
    sdk = ShellSdk.init(null as any as Window, sdkOrigin, windowMock);
    expect(sdk).toBeDefined();
  });

  it('should return same instance', () => {
    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);
    const sdkCopy = ShellSdk.instance;
    expect(sdk).toEqual(sdkCopy);
  });

  it('should post message on emit', () => {
    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);
    sdk.emit(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, data);

    const arg1 = sdkTarget.postMessage.getCall(0).args[0];
    const arg2 = sdkTarget.postMessage.getCall(0).args[1];

    sinon.assert.calledOnce(sdkTarget.postMessage);
    expect(arg1.type).toBe(SHELL_EVENTS.Version1.REQUIRE_CONTEXT);
    expect(arg1.value.message).toBe('test');
    expect(arg2).toBe(sdkOrigin);
  });

  it('should add message listener', () => {
    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);
    expect(windowMockEventListenerAdded).toBe(true);
    expect(windowMockEventType).toBe('message'),
    expect(windowMockCallback).toBeDefined();
  });

  it('should call subscriber on message event', (done) => {
    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);
    sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, (value) => {
      expect(value.message).toBe('test data');
      done();
    });
    windowMockCallback({
      data: {
        type: SHELL_EVENTS.Version1.REQUIRE_CONTEXT,
        value: {
          message: 'test data'
        }
      }
    });
  });

  it('should call multiple subscribers on message event', () => {
    let handler1Called: boolean = false;
    let handler2Called: boolean = false;

    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);

    sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, () => {
      handler1Called = true;
    });

    sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, () => {
      handler2Called = true;
    });

    windowMockCallback({
      data: {
        type: SHELL_EVENTS.Version1.REQUIRE_CONTEXT,
        value: {
          message: 'test data'
        }
      }
    });

    expect(handler1Called).toBe(true);
    expect(handler2Called).toBe(true);
  });

  it('should be able to remove subscriber', () => {
    let handler1Called: boolean = false;
    let handler2Called: boolean = false;

    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);

    const unsubscriber = sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, () => {
      handler1Called = true;
    });

    sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, () => {
      handler2Called = true;
    });

    unsubscriber();
    windowMockCallback({
      data: {
        type: SHELL_EVENTS.Version1.REQUIRE_CONTEXT,
        value: {
          message: 'test data'
        }
      }
    });

    expect(handler1Called).toBe(false);
    expect(handler2Called).toBe(true);
  });

  it('should confirm context with request_context_done event', () => {
    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);

    const requestContext = sinon.spy();
    const requestContextDone = sinon.spy();

    sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, requestContext);
    sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT_DONE, requestContextDone);

    windowMockCallback({
      data: {
        type: SHELL_EVENTS.Version1.REQUIRE_CONTEXT,
        value: {
          message: 'test data',
        }
      }
    });

    expect(requestContext.called).toBe(true);
    expect(requestContextDone.called).toBe(true);
  });

  it('should init viewState on request_context event', () => {
    let technicianId: number;
    let servicecallId: number;

    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);

    sdk.onViewState('TECHNICIAN', id => technicianId = id);
    sdk.onViewState('SERVICECALL', id => servicecallId = id);

    windowMockCallback({
      data: {
        type: SHELL_EVENTS.Version1.REQUIRE_CONTEXT,
        value: {
          message: 'test data',
          viewState: {
            'TECHNICIAN': 42,
            'SERVICECALL': 1337
          }
        }
      }
    });

    expect(technicianId).toEqual(42);
    expect(servicecallId).toEqual(1337);
  });

  it('should trigger onViewState between request_context and request_context_done', () => {
    sdk = ShellSdk.init(sdkTarget, sdkOrigin, windowMock);

    const requestContext = sinon.spy();
    const requestContextDone = sinon.spy();

    const onViewStateTechnician = sinon.spy();
    const onViewStateServiceCall = sinon.spy();

    sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, requestContext);

    sdk.onViewState('TECHNICIAN', onViewStateTechnician);
    sdk.onViewState('SERVICECALL', onViewStateServiceCall);

    sdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT_DONE, requestContextDone);

    windowMockCallback({
      data: {
        type: SHELL_EVENTS.Version1.REQUIRE_CONTEXT,
        value: {
          message: 'test data',
          viewState: {
            'TECHNICIAN': 42,
            'SERVICECALL': 1337
          }
        }
      }
    });

    expect(requestContext.called).toBe(true);
    expect(requestContext.called).toBe(true);
    expect(requestContext.called).toBe(true);
    expect(requestContextDone.called).toBe(true);

    expect(requestContext.calledBefore(onViewStateTechnician)).toBe(true);
    expect(requestContext.calledBefore(onViewStateServiceCall)).toBe(true);
    expect(requestContext.calledBefore(requestContextDone)).toBe(true);
    expect(onViewStateTechnician.calledBefore(requestContextDone)).toBe(true);
    expect(onViewStateServiceCall.calledBefore(requestContextDone)).toBe(true);
  });

});
