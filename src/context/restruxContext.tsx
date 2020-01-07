import { Observable, Observer, BehaviorSubject } from 'rxjs';
import React, { createContext, useMemo, useEffect, useRef } from 'react';
import { ContextType, Store, ProviderProps } from '../interfaces';

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

const useCreateContext = <S extends any>(store: Store<S>) => {
  const unsubscribe = useRef<() => void>();
  const contextValue = useMemo(() => {
    let invalidationStream = InvalidationSubject();
    let currentInvalidationDepth = 0;
    let maxInvalidationDepth = 0;
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
      getCurrentInvalidationDepth: () => currentInvalidationDepth,
      addInvalidationDepth: (depth) => {
        maxInvalidationDepth = Math.max(maxInvalidationDepth, depth);
      },
      rootStream,
      invalidationStream,
    };
  }, [store]);
  useEffect(() => () => {
    if (unsubscribe.current) {
      unsubscribe.current();
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
