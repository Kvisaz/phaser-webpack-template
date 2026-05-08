import { Command, EventBus } from "./EventBus";

describe("EventBus", () => {
  it("should subscribe to event", () => {
    const bus = new EventBus();
    const callback = jest.fn();

    bus.on(callback);
    bus.once(callback);

    const command: Command = { type: "test" };
    bus.emit(command);

    expect(callback).toBeCalledTimes(2);
    expect(callback).toBeCalledWith(command);
  });

  it("should unsubscribe all", () => {
    const bus = new EventBus();
    const callback = jest.fn();

    bus.on(callback);
    bus.unSubScribeAll();

    bus.emit({ type: "test" });

    expect(callback).not.toBeCalled();
  });

  it("should subscribe once", () => {
    const bus = new EventBus();
    const callback = jest.fn();

    bus.once(callback);

    bus.emit({ type: "test" });
    bus.emit({ type: "test" });

    expect(callback).toBeCalledTimes(1);
  });

  it("should pass command to callback", () => {
    const bus = new EventBus();

    const command = { type: "start", speed: 100 };

    bus.on((cmd) => {
      expect(cmd).toEqual(command);
    });

    bus.emit(command);
  });
});
