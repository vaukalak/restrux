import { Observable, Observer, BehaviorSubject } from 'rxjs';
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

interface InvalidationSubjectLike extends Observable<any> {
  next(): void;
}

const InvalidationSubject = () => {
  let invalidationSubscribers: Observer<void>[] = [];
  let observable: InvalidationSubjectLike = new Observable<void>(
    (subscriber) => {
      invalidationSubscribers.push(subscriber);
      return () => {
        const index = invalidationSubscribers.indexOf(subscriber);
        if (index !== -1) {
          invalidationSubscribers.splice(index, 1);
        }
      }
    }
  ) as InvalidationSubjectLike;
  observable.next = () => {
    // some items may be created and hence subscribed during notification phase
    const formerInvalidationSubscribers = invalidationSubscribers.concat();
    invalidationSubscribers = [];
    formerInvalidationSubscribers.forEach((subscriber) => {
      subscriber.next();
    });
  }
  return observable;
}

export const Provider = <S extends any>({ children, store }: ProviderProps<S>) => {
  const unsubscribe = useRef<() => void>();
  const contextValue = useMemo(() => {
    let invalidationStream = InvalidationSubject();
    let rootStream: BehaviorSubject<S> = new BehaviorSubject(store.getState());
    let update = () => {
      // we first update all state subscribers, so if those where modified, they can
      // subscribe to invalidation stream
      rootStream.next(store.getState());
      invalidationStream.next();
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
      rootStream,
      invalidationStream,
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
