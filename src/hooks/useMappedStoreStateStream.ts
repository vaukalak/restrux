import { useMemo, useContext } from 'react';
import { Subscriber, Observable } from 'rxjs';
import { createStreamSelector, FunctionOrDefinition } from '../selectors';
import { Context } from '../context';

export const useMappedStoreStateStream = <S, R extends any>(selectorDefinition: FunctionOrDefinition<S, R>) => {
    const { rootStream, invalidationStream, selectorsPool } = useContext(Context);
    return useMemo(
      () => {
        let nextState: R;
        let notified = false;
        let subscribedToNotification = false;
        const subscribers: Subscriber<R>[] = [];
        const streamSelector = createStreamSelector(selectorDefinition, selectorsPool)(rootStream);
        const subscription = streamSelector.subscribe((state) => {
          if (nextState === state) {
            return;
          }
          nextState = state;
          if (notified) {
            // since our mapped state is orchestration of several streams and we don't know
            // how many, we just store state in variable until `notifierStream` will dispatch
            if (!subscribedToNotification) {
              subscribedToNotification = true;
              const unsubscribeNotifier = invalidationStream.subscribe(() => {
                subscribedToNotification = false;
                unsubscribeNotifier.unsubscribe();
                subscribers.forEach(subscriber => {
                  subscriber.next(nextState);
                });
              });
            }
          } else {
            notified = true;
            subscribers.forEach(subscriber => {
              subscriber.next(nextState);
            });
          }
        });
        // need to unsubscribe when no subscribers
        const mappedStream = new Observable(subscrbier => {
          subscribers.push(subscrbier);
          subscrbier.next(nextState);
          return () => {
            subscribers.splice(subscribers.indexOf(subscrbier), 1);
            if (subscribers.length === 0) {
              subscription.unsubscribe();
            }
          };
        });
        return mappedStream;
      },
      [rootStream, selectorDefinition, invalidationStream, selectorsPool],
    );
  };