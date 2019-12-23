import { SelectorDefinition, FunctionOrDefinition } from './definitions/defineSelector';
import { SelectorsPool, SelectorsPoolEntry } from '../context';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';

const createDistinctStream = <T, R>(stream: Observable<T>, transformer: (v: T) => R) => {
  return stream
    .pipe(map(transformer))
    .pipe(distinctUntilChanged());
}

const createCombined = <S extends any, R>(
  definition: SelectorDefinition<S, R>,
  storeStream: Observable<S>,
  selectorsPool: SelectorsPool<S>,
) => {
  const { selectors, combiner } = definition;
  return createDistinctStream(
    combineLatest(selectors.map(
      (selectorEntry: FunctionOrDefinition<S, any>) => {
        const cachedEntry = selectorsPool.get(definition) as SelectorsPoolEntry<any>;
        if (!cachedEntry) {
          if (typeof selectorEntry === 'function') {
            const entryStream = createDistinctStream(storeStream, selectorEntry);
            selectorsPool.set(
              selectorEntry,
              {
                observable: entryStream,
                usages: 1,
              }
            );
            return entryStream;
          } else {
            // function will take care of caching internaly
            return createStreamSelector(selectorEntry, selectorsPool)(storeStream);
          }
        }
        return cachedEntry.observable;
      }
    )),
    arr => combiner(...arr)
  );
};

const incUsages = (
  definition: FunctionOrDefinition<any, any>,
  selectorsPool: SelectorsPool<any>,
) => {
  selectorsPool.get(definition)!.usages += 1;
  if (typeof definition === 'function') {
    return;
  }
  definition.selectors.forEach((definitionEntry) => {
    if (typeof definitionEntry === 'function') {
      // if selector is in pool, I hope it's children are as well
      selectorsPool.get(definitionEntry)!.usages += 1;
    } else {
      incUsages(definitionEntry, selectorsPool);
    }
  });
}

const decUsages = (
  definition: FunctionOrDefinition<any, any>,
  selectorsPool: SelectorsPool<any>,
) => {
  const definitionPoolEntry = selectorsPool.get(definition)!;
  definitionPoolEntry.usages -= 1;
  // hope it will never be < 0 :)
  if (definitionPoolEntry.usages <= 0) {
    selectorsPool.delete(definition)
  }
  if (typeof definition === 'function') {
    return;
  }
  definition.selectors.forEach((definitionEntry) => {
    // if selector is in pool, I hope it's children are as well
    // we don't unsusbscribe child defintions, cause there cache is managed internaly
    const poolEntry = selectorsPool.get(definitionEntry)!;
    if (typeof definitionEntry === 'function') {
      poolEntry.usages -= 1;
      // hope it will never be < 0 :)
      if (poolEntry.usages <= 0) {
        selectorsPool.delete(definitionEntry)
      }
    }
  });
}

export const createStreamFromDefinition = <S extends any, R>(
  storeStream: Observable<S>,
  definition: SelectorDefinition<S, R>,
  selectorsPool: SelectorsPool<S>,
) => {
  const { selectors, combiner } = definition;
  return selectors.length > 0 ?
    createCombined(definition, storeStream, selectorsPool) :
    createDistinctStream(storeStream, combiner)
}

export const createStreamSelector = <S extends any, R>(
  definition: FunctionOrDefinition<S, R>,
  selectorsPool: SelectorsPool<S>
) => 
  (storeStream: Observable<S>): Observable<R> => {
    const internalStream = (() => {
      const cached = selectorsPool.get(definition) as SelectorsPoolEntry<R>;
      if (!cached) {
        const resultStream = typeof definition === 'function' ?
          createDistinctStream(storeStream, definition) :
          createStreamFromDefinition(storeStream, definition, selectorsPool);
        selectorsPool.set(definition, {
          observable: resultStream,
          usages: 1,
        });
        return resultStream;
      }
      incUsages(definition, selectorsPool);
      return cached.observable;
    })();
    return new Observable(observer => {
      const internalSubscription = internalStream.subscribe(
        (next) => {
          observer.next(next);
        }
      );
      return () => {
        decUsages(definition, selectorsPool);
        internalSubscription.unsubscribe();
      }
    });
  };
  