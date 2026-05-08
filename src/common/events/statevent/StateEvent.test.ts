import { State, StateEvent } from "./StateEvent";

describe("StateEvent", () => {
  it("should initialize with state", () => {
    const state = 123;
    const stateEvent = new StateEvent(state);

    expect(stateEvent.getState()).toBe(state);
  });

  it("should add and remove subscribers", () => {
    const stateEvent = new StateEvent();
    const callback = jest.fn();

    const unsub = stateEvent.on(callback);
    stateEvent.emit(456);

    expect(callback).toBeCalledWith(456);

    unsub();
    stateEvent.emit(789);

    expect(callback).toBeCalledTimes(1);
  });

  it("should notify all subscribers on emit", () => {
    const stateEvent = new StateEvent();
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    stateEvent.on(callback1);
    stateEvent.on(callback2);

    stateEvent.emit("hello");

    expect(callback1).toBeCalledWith("hello");
    expect(callback2).toBeCalledWith("hello");
  });

  it("should unsubscribe all", () => {
    const stateEvent = new StateEvent();
    const callback = jest.fn();

    stateEvent.on(callback);
    stateEvent.unSubScribeAll();

    stateEvent.emit("test");

    expect(callback).not.toBeCalled();
  });

  it("should call subscriber once for once method", () => {
    const stateEvent = new StateEvent();
    const callback = jest.fn();

    stateEvent.once(callback);
    stateEvent.emit("a");
    stateEvent.emit("b");

    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith("a");
  });

  it("should continue notifying other subscribers when one throws", () => {
    const stateEvent = new StateEvent();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const badListener = jest.fn(() => {
      throw new Error("boom");
    });
    const goodListener = jest.fn();

    stateEvent.on(badListener);
    stateEvent.on(goodListener);

    stateEvent.emit("payload");

    expect(goodListener).toBeCalledWith("payload");
    expect(goodListener).toBeCalledTimes(1);
    expect(errorSpy).toBeCalledTimes(1);

    errorSpy.mockRestore();
  });

  it("should remove once-subscriber even if it throws", () => {
    const stateEvent = new StateEvent();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const explosive = jest.fn(() => {
      throw new Error("fail once");
    });

    stateEvent.once(explosive);

    stateEvent.emit("first");
    stateEvent.emit("second");

    expect(explosive).toBeCalledTimes(1);
    expect(errorSpy).toBeCalledTimes(1);

    errorSpy.mockRestore();
  });

  it("should reject await when all subscribers are cleared", async () => {
    const stateEvent = new StateEvent<string>();

    const waitPromise = stateEvent.await();
    stateEvent.unSubScribeAll();

    await expect(waitPromise).rejects.toThrow("StateEvent await cancelled");
  });
});

describe("State", () => {
  it("should initialize state", () => {
    const initialState = 10;
    const state = new State(initialState);

    expect(state.getState()).toBe(initialState);
  });
});
