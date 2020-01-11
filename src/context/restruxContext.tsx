import { Observable, Observer, BehaviorSubject } from 'rxjs';
import React, { createContext, useMemo, useEffect, useRef } from 'react';
import { ContextType, Store, ProviderProps } from '../interfaces';

export const Context = createContext<ContextType<any>>(undefined as any);

interface InvalidationSubjectLike<T> extends Observable<any> {
  next(data: T): void;
}

const InvalidationSubject = <T extends any>() => {
  let invalidationSubscribers: Observer<T>[] = [];
  let observable: InvalidationSubjectLike<T> = new Observable<T>(
    (subscriber) => {
      invalidationSubscribers.push(subscriber);
      return () => {
        const index = invalidationSubscribers.indexOf(subscriber);
        if (index !== -1) {
          invalidationSubscribers.splice(index, 1);
        }
      }
    }
  ) as InvalidationSubjectLike<T>;
  observable.next = (data: T) => {
    // some items may be created and hence subscribed during notification phase
    const formerInvalidationSubscribers = invalidationSubscribers.concat();
    invalidationSubscribers = [];
    formerInvalidationSubscribers.forEach((subscriber) => {
      subscriber.next(data);
    });
  }
  return observable;
}

export const createRestruxContext = <S extends any>(
  unsubscribeRef: { current: (() => void) | undefined },
  store: Store<S>,
) => {
  let invalidationStream = InvalidationSubject<void>();
  let depthInvalidationStream = InvalidationSubject<number>();
  let currentInvalidationDepth = 0;
  let maxInvalidationDepth = 0;
  let rootStream: BehaviorSubject<S> = new BehaviorSubject(store.getState());
  let update = () => {
    // we first update all state subscribers, so if those where modified, they can
    // subscribe to invalidation stream
    rootStream.next(store.getState());
    while (currentInvalidationDepth < maxInvalidationDepth) {
      currentInvalidationDepth++;
      depthInvalidationStream.next(currentInvalidationDepth);
    }
    currentInvalidationDepth = 0;
    maxInvalidationDepth = 0;
    invalidationStream.next();
  }
  if (unsubscribeRef.current) {
    unsubscribeRef.current();
  }
  unsubscribeRef.current = store.subscribe(() => {
    update();
  });
  update();
  return {
    selectorsPool: new Map(),
    getState: () => store.getState(),
    getCurrentInvalidationDepth: () => currentInvalidationDepth,
    addInvalidationDepth: (depth: number) => {
      maxInvalidationDepth = Math.max(maxInvalidationDepth, depth);
    },
    depthInvalidationStream,
    rootStream,
    invalidationStream,
  };
};

const useCreateContext = <S extends any>(store: Store<S>) => {
  const unsubscribeRef = useRef<() => void>();
  unsubscribeRef.current;
  const contextValue = useMemo(
    () => createRestruxContext(
      unsubscribeRef,
      store,
    ),
    [store],
  );
  useEffect(() => () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
  }, []);
  return contextValue;
};

export const Provider = <S extends any>({ children, store }: ProviderProps<S>) => {
  const contextValue = useCreateContext(store);
  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};
