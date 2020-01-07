import { Observable, combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { SelectorDefinition, FunctionOrDefinition } from './definitions/defineSelector';
import { SelectorsPool, SelectorObservable, SelectorsPoolEntry, ContextType } from '../interfaces';
import { createUsage, decUsages, incUsages } from './poolUtils';

const createDistinctStream = <T, R>(parentStream: Observable<T>, transformer: (v: T) => R, depth: number) => {
  const stream: Partial<SelectorObservable<R>> = parentStream
    .pipe(map(transformer))
    // .pipe(tap(v => console.log('v: ', v)))
    .pipe(distinctUntilChanged());
  stream.depth = depth;
  return stream as SelectorObservable<R>;
}

export const createFromFunctionOrDefinition = <S, R>(
  definition: FunctionOrDefinition<S, R>,
  parentStream: Observable<S>,
  restruxContext: ContextType<S>,
): SelectorObservable<R> => {
  const cached = restruxContext.selectorsPool.get(definition) as SelectorsPoolEntry<R>;
  // console.log('definition: ', definition);
  // console.log('cached: ', cached);
  if (cached) {
    return cached.observable;
  }
  let newValue: SelectorObservable<R>;
  if (typeof definition === 'function') {
    newValue = createDistinctStream(parentStream, definition, 0);
  } else {
    if (definition.selectors.length > 0) {
      newValue = createCombined(definition, parentStream, restruxContext);
    } else {
      newValue = createFromFunctionOrDefinition(definition.combiner, parentStream, restruxContext);
    }
  }
  createUsage(definition, restruxContext.selectorsPool, newValue);
  return newValue;
};

const createCombined = <S extends any, R>(
  definition: SelectorDefinition<S, R>,
  parentStream: Observable<S>,
  restruxContext: ContextType<S>,
): SelectorObservable<R> => {
  const { selectors, combiner } = definition;
  const selectorStreams = selectors.map(
    (definitionEntry) =>
      createFromFunctionOrDefinition(
        definitionEntry,
        parentStream,
        restruxContext,
      )
  );
  const depth = Math.max(...selectorStreams.map(({ depth }) => depth)) + 1;
  return createDistinctStream(
    combineLatest(selectorStreams),
    arr => {
      console.log('combiner on depth: ', depth);
      return combiner(...arr);
    },
    depth
  );
};

const usageAwareObservable = <S, R>(
  stream: Observable<R>,
  definition: FunctionOrDefinition<S, R>,
  restruxContext: ContextType<S>,
): Observable<R> => {
  incUsages(definition, restruxContext.selectorsPool);
  return new Observable(observer => {
    const internalSubscription = stream.subscribe(observer);
    return () => {
      decUsages(definition, restruxContext.selectorsPool);
      internalSubscription.unsubscribe();
    }
  });
}

export const createStreamSelector = <S extends any, R>(
  definition: FunctionOrDefinition<S, R>,
  restruxContext: ContextType<S>
) => (parentStream: Observable<S>): Observable<R> =>
  usageAwareObservable(
    createFromFunctionOrDefinition(
      definition,
      parentStream,
      restruxContext,
    ),
    definition,
    restruxContext,
  );
