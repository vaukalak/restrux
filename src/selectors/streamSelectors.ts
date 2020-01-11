import { Observable, combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { SelectorDefinition, FunctionOrDefinition } from './definitions/defineSelector';
import { SelectorObservable, SelectorsPoolEntry, ContextType } from '../interfaces';
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
  if (cached) {
    return cached.observable;
  }
  let newValue: SelectorObservable<R>;
  if (typeof definition === 'function') {
    newValue = createDistinctStream(parentStream, definition, 0);
  } else {
    if (definition.selectors.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
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
  type SelectorSubject = SelectorObservable<R> & Subject<R>;
  const stableSelectorsSubject: SelectorSubject = new Subject() as any;
  (stableSelectorsSubject).depth = depth;
  restruxContext.addInvalidationDepth(depth);
  let currentValues: any[];
  combineLatest(selectorStreams).subscribe(value => {
    currentValues = value;
    if (restruxContext.getCurrentInvalidationDepth() === depth) {
      stableSelectorsSubject.next(combiner(...currentValues));
    }
  });
  restruxContext.depthInvalidationStream.subscribe((incomingDepth) => {
    if (incomingDepth === depth) {
      stableSelectorsSubject.next(combiner(...currentValues));
    }
  })
  return stableSelectorsSubject;
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
