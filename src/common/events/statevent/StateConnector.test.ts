import { State } from "./StateEvent";
import { StateConnector } from "./StateConnector";

describe("StateConnector", () => {
  it("listens to shared state updates", () => {
    const state = new State({ score: 0 });
    const connectorA = new StateConnector(state);
    const connectorB = new StateConnector(state);
    const listenerA = jest.fn();
    const listenerB = jest.fn();

    connectorA.on(listenerA);
    connectorB.on(listenerB);

    const nextState = { score: 10 };
    state.setState(nextState);

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerA).toHaveBeenCalledWith(nextState);
    expect(listenerB).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledWith(nextState);
  });

  it("propagates updates triggered through connectors", () => {
    const state = new State({ score: 0 });
    const connectorA = new StateConnector(state);
    const connectorB = new StateConnector(state);
    const listenerA = jest.fn();
    const listenerB = jest.fn();

    connectorA.on(listenerA);
    connectorB.on(listenerB);

    connectorA.setState((prev) => ({ score: prev.score + 5 }));
    const emittedState = { score: 25 };
    connectorB.emit(emittedState);

    expect(listenerA).toHaveBeenNthCalledWith(1, { score: 5 });
    expect(listenerB).toHaveBeenNthCalledWith(1, { score: 5 });
    expect(listenerA).toHaveBeenNthCalledWith(2, emittedState);
    expect(listenerB).toHaveBeenNthCalledWith(2, emittedState);
    expect(state.getState()).toEqual(emittedState);
  });

  it("unSubScribeAll clears only connector-local subscriptions", () => {
    const state = new State({ score: 0 });
    const connectorA = new StateConnector(state);
    const connectorB = new StateConnector(state);
    const listenerA = jest.fn();
    const listenerB = jest.fn();
    const directListener = jest.fn();

    state.on(directListener);
    connectorA.on(listenerA);
    connectorB.on(listenerB);

    const firstUpdate = { score: 1 };
    state.setState(firstUpdate);

    expect(listenerA).toHaveBeenLastCalledWith(firstUpdate);
    expect(listenerB).toHaveBeenLastCalledWith(firstUpdate);
    expect(directListener).toHaveBeenLastCalledWith(firstUpdate);

    connectorA.unSubScribeAll();

    const secondUpdate = { score: 2 };
    state.setState(secondUpdate);

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(2);
    expect(listenerB).toHaveBeenNthCalledWith(2, secondUpdate);
    expect(directListener).toHaveBeenCalledTimes(2);
    expect(directListener).toHaveBeenNthCalledWith(2, secondUpdate);
  });

  it("honors once subscribers and keeps other listeners intact", () => {
    const state = new State({ score: 0 });
    const connectorA = new StateConnector(state);
    const connectorB = new StateConnector(state);
    const onceListener = jest.fn();
    const persistentListener = jest.fn();

    connectorA.once(onceListener);
    const unsubscribe = connectorB.on(persistentListener);

    state.emit({ score: 7 });
    state.emit({ score: 9 });

    expect(onceListener).toHaveBeenCalledTimes(1);
    expect(onceListener).toHaveBeenCalledWith({ score: 7 });
    expect(persistentListener).toHaveBeenCalledTimes(2);

    unsubscribe();
    state.emit({ score: 11 });
    expect(persistentListener).toHaveBeenCalledTimes(2);
  });

  it("await resolves with next state update", async () => {
    const state = new State({ score: 0 });
    const connector = new StateConnector(state);

    const waitPromise = connector.await();

    state.setState({ score: 42 });

    await expect(waitPromise).resolves.toEqual({ score: 42 });
  });
});
