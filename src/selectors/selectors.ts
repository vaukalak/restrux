import { FunctionOrDefinition } from './definitions/defineSelector';

export const createSelector = <S extends any, R>(
  definition: FunctionOrDefinition<S, R>
) =>
  (state: S): R => {
    if (typeof definition === 'function') {
      return definition(state);
    }
    return definition.selectors.length > 0 ?
      definition.combiner(
        ...definition.selectors.map(
          (selectorEntry: FunctionOrDefinition<S, any>) => {
            if (typeof selectorEntry === 'function') {
              return selectorEntry(state);
            }
            return createSelector(selectorEntry)(state);
          }
        )
      ) :
      definition.combiner(state);    
  };
