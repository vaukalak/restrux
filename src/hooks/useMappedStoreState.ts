import { useMemo, useEffect, useState } from 'react';
import {
  FunctionOrDefinition,
} from '../selectors';
import { useMappedStoreStateStream } from './useMappedStoreStateStream';
import { Subscription } from 'rxjs';

export const useMappedStoreState = <S, R extends any>(selectorDefinition: FunctionOrDefinition<S, R>) => {
    const mappedStream = useMappedStoreStateStream(selectorDefinition);
    const [localState, setLocalState] = useState<R | undefined>(undefined);
    let updatedState = localState;
    const subscription = useMemo<Subscription>(() => {
      return mappedStream.subscribe((state: any) => {
        setLocalState(state);
        updatedState = state;
      })
    }, [mappedStream]);
    useEffect(() => {
      return () => {
        subscription.unsubscribe();
      };
    }, [subscription]);
    return updatedState as R;
  };