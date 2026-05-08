import { EventEmitter } from 'events';
import { normalizeEventName, typedEmit, typedSub } from './typedSub';

describe('typedSub', () => {
  const prevPhaser = (globalThis as { Phaser?: unknown }).Phaser;

  beforeAll(() => {
    (globalThis as { Phaser?: unknown }).Phaser = {
      GameObjects: { Events: { DESTROY: 'destroy' } },
    };
  });

  afterAll(() => {
    (globalThis as { Phaser?: unknown }).Phaser = prevPhaser;
  });

  const createEmitter = () => new EventEmitter() as unknown as Phaser.Events.EventEmitter;
  const createDestroyable = () => new EventEmitter() as unknown as Phaser.GameObjects.GameObject;

  it('normalizeEventName builds scoped and plain names', () => {
    expect(normalizeEventName('tick')).toBe('tick');
    expect(normalizeEventName('tick', '')).toBe('tick');
    expect(normalizeEventName('tick', 'hud')).toBe('hud.tick');
  });

  it('typedSub listens and typedEmit emits payload', () => {
    const eventEmitter = createEmitter();
    const listener = jest.fn();

    typedSub<number>({
      eventEmitter,
      eventName: 'score',
      on: listener,
    });

    typedEmit<number>({
      eventEmitter,
      eventName: 'score',
      data: 10,
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(10);
  });

  it('typedEmit emits with normalized scope prefix', () => {
    const eventEmitter = new EventEmitter();
    const listener = jest.fn();
    const payload = { value: 42 };

    eventEmitter.on('ui.update', listener);

    typedEmit({
      eventEmitter: eventEmitter as unknown as Phaser.Events.EventEmitter,
      eventName: 'update',
      scope: 'ui',
      data: payload,
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(payload);
  });

  it('typedSub once handles only first event', () => {
    const eventEmitter = createEmitter();
    const listener = jest.fn();

    typedSub<string>({
      eventEmitter,
      eventName: 'state',
      on: listener,
      once: true,
    });

    typedEmit({ eventEmitter, eventName: 'state', data: 'a' });
    typedEmit({ eventEmitter, eventName: 'state', data: 'b' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('a');
  });

  it('typedSub without once handles all events', () => {
    const eventEmitter = createEmitter();
    const listener = jest.fn();

    typedSub<number>({
      eventEmitter,
      eventName: 'loop',
      on: listener,
    });

    typedEmit({ eventEmitter, eventName: 'loop', data: 1 });
    typedEmit({ eventEmitter, eventName: 'loop', data: 2 });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, 1);
    expect(listener).toHaveBeenNthCalledWith(2, 2);
  });

  it('typedSub with scope receives only matching scoped events', () => {
    const eventEmitter = createEmitter();
    const listener = jest.fn();

    typedSub<number>({
      eventEmitter,
      eventName: 'hit',
      scope: 'player',
      on: listener,
    });

    typedEmit({ eventEmitter, eventName: 'hit', scope: 'enemy', data: 10 });
    typedEmit({ eventEmitter, eventName: 'hit', scope: 'player', data: 15 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(15);
  });

  it('typedEmit with empty scope emits plain event name', () => {
    const eventEmitter = new EventEmitter();
    const listener = jest.fn();

    eventEmitter.on('plain', listener);

    typedEmit({
      eventEmitter: eventEmitter as unknown as Phaser.Events.EventEmitter,
      eventName: 'plain',
      scope: '',
      data: 7,
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(7);
  });

  it('returned unSub removes listener and destroy hook', () => {
    const eventEmitter = createEmitter();
    const autoUnSub = createDestroyable();
    const listener = jest.fn();

    const unSub = typedSub<number>({
      eventEmitter,
      eventName: 'hp',
      on: listener,
      autoUnSub,
    });

    expect((autoUnSub as unknown as EventEmitter).listenerCount('destroy')).toBe(1);

    unSub();
    unSub();

    expect((autoUnSub as unknown as EventEmitter).listenerCount('destroy')).toBe(0);

    typedEmit({ eventEmitter, eventName: 'hp', data: 5 });
    expect(listener).not.toHaveBeenCalled();
  });

  it('unSub before emit prevents callback execution', () => {
    const eventEmitter = createEmitter();
    const listener = jest.fn();

    const unSub = typedSub<number>({
      eventEmitter,
      eventName: 'shield',
      on: listener,
    });

    unSub();
    typedEmit({ eventEmitter, eventName: 'shield', data: 3 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('once subscription clears autoUnSub destroy hook after first event', () => {
    const eventEmitter = createEmitter();
    const autoUnSub = createDestroyable() as unknown as EventEmitter;
    const listener = jest.fn();

    typedSub<number>({
      eventEmitter,
      eventName: 'xp',
      on: listener,
      once: true,
      autoUnSub: autoUnSub as unknown as Phaser.GameObjects.GameObject,
    });

    expect(autoUnSub.listenerCount('destroy')).toBe(1);

    typedEmit({ eventEmitter, eventName: 'xp', data: 100 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(autoUnSub.listenerCount('destroy')).toBe(0);
  });

  it('autoUnSub destroy event unsubscribes listener automatically', () => {
    const eventEmitter = createEmitter();
    const autoUnSub = createDestroyable() as unknown as EventEmitter;
    const listener = jest.fn();

    typedSub<number>({
      eventEmitter,
      eventName: 'coins',
      on: listener,
      autoUnSub: autoUnSub as unknown as Phaser.GameObjects.GameObject,
    });

    autoUnSub.emit('destroy');

    typedEmit({ eventEmitter, eventName: 'coins', data: 1 });
    expect(listener).not.toHaveBeenCalled();
  });
});
