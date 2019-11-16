import { useContext, useEffect, useState } from 'react';
import { Context } from '../context';
import {
  FunctionOrDefinition,
  createSelector,
} from '../selectors';
import { useMappedStoreStateStream } from './useMappedStoreStateStream';

export const useMappedStoreState = <S, R extends any>(selectorDefinition: FunctionOrDefinition<S, R>) => {
    const { getState } = useContext(Context);
    const mappedStream = useMappedStoreStateStream(selectorDefinition);
    const [localState, setLocalState] = useState(createSelector(selectorDefinition)(getState()));
    useEffect(() => {
      const subscription = mappedStream.subscribe((state: any) => {
        setLocalState(state);
      });
      return () => {
        subscription.unsubscribe();
      };
    }, [mappedStream]);
    return localState as R;
  };