import { SelectorsPool, SelectorObservable } from '../interfaces';
import { FunctionOrDefinition } from './definitions/defineSelector';

export const createUsage = <S, R>(
  selectorEntry: FunctionOrDefinition<S, R>,
  selectorsPool: SelectorsPool<S>,
  entryStream: SelectorObservable<R>,
) => {
  selectorsPool.set(
    selectorEntry,
    {
      observable: entryStream,
      usages: 0,
    }
  );
};

export const incUsages = (
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

export const decUsages = (
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
    