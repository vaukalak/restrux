import { Observable, Observer } from 'rxjs';
import React, { createContext, useMemo, useEffect, useRef } from 'react';
import { FunctionOrDefinition } from '../selectors';

interface Store<S> {
  subscribe: (listener: () => void) => () => void;
  getState(): S;
}

interface ProviderProps<S> {
  children: React.ReactElement;
  store: Store<S>;
}

export type SelectorsPoolEntry<R> = {
  observable: Observable<R>,
  usages: number,
};

export type SelectorsPool<S, R = any> = Map<
  FunctionOrDefinition<S, R>,
  SelectorsPoolEntry<R>
>;

type ContextType<S> = {
  rootStream: Observable<S>,
  getState: () => S,
  invalidationStream: Observable<void>,
  selectorsPool: SelectorsPool<S>,
};

export const Context = createContext<ContextType<any>>(undefined as any);

export const Provider = <S extends any>({ children, store }: ProviderProps<S>) => {
  const unsubscribe = useRef<() => void>();
  const contextValue = useMemo(() => {
    let invalidationSubscribers: Observer<void>[] = [];
    let rootSubscribers: Observer<S>[] = [];
    let update = () => {
      // we first update all state subscribers, so if those where modified, they can
      // subscribe to invalidation stream
      const state = store.getState();
      rootSubscribers.forEach((subscriber) => {
        subscriber.next(state);
      });
      // some items may be created and hence subscribed during notification phase
      const formerInvalidationSubscribers = invalidationSubscribers.concat();
      invalidationSubscribers = [];
      formerInvalidationSubscribers.forEach((subscriber) => {
        subscriber.next();
      });
    }
    if (unsubscribe.current) {
      unsubscribe.current();
    }
    unsubscribe.current = store.subscribe(() => {
      update();
    });
    update();
    return {
      selectorsPool: new Map(),
      getState: () => store.getState(),
      rootStream: new Observable<S>((subscriber) => {
        subscriber.next(store.getState());
        rootSubscribers.push(subscriber);
        return () => {
          const index = rootSubscribers.indexOf(subscriber);
          if (index !== -1) {
            rootSubscribers.splice(index, 1);
          }
        }
      }),
      invalidationStream: new Observable<void>((subscriber) => {
        invalidationSubscribers.push(subscriber);
        return () => {
          const index = invalidationSubscribers.indexOf(subscriber);
          if (index !== -1) {
            invalidationSubscribers.splice(index, 1);
          }
        }
      })
    };
  }, [store]);
  useEffect(() => () => {
    if (unsubscribe.current) {
      unsubscribe.current();
    }
  }, []);
  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};
