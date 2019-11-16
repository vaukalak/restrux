import {
  defineSelector,
  FunctionOrDefinition,
} from './defineSelector';
import { DefinitionReturn } from './defineSelectorMap';

type OneKeySelector<S, Base> =
  <
    A extends keyof Base,
    R extends FunctionOrDefinition<S, Base[A]>,
  >(
    keys: [A],
    defaultValue?: DefinitionReturn<R>,
  ) => R;

type TwoKeysSelector<S, Base> = 
  <
    A extends keyof Base,
    B extends keyof Base[A],
    R extends FunctionOrDefinition<S, Base[A][B]>,
  >(
    keys: [A, B],
    defaultValue?: DefinitionReturn<R>,
  ) => R;

type ThreeKeysSelector<S, Base> = 
  <
    A extends keyof Base,
    B extends keyof Base[A],
    C extends keyof Base[A][B],
    R extends FunctionOrDefinition<S, Base[A][B][C]>
  >(
    keys: [A, B, C],
    defaultValue?: DefinitionReturn<R>,
  ) => R;
  
type FourKeysSelector<S, Base> = 
  <
    A extends keyof Base,
    B extends keyof Base[A],
    C extends keyof Base[A][B],
    D extends keyof Base[A][B][C],
    R extends FunctionOrDefinition<S, Base[A][B][C][D]>
  >(
    keys: [A, B, C, D],
    defaultValue?: DefinitionReturn<R>,
  ) => R;

type FiveKeysSelector<S, Base> = 
  <
    A extends keyof Base,
    B extends keyof Base[A],
    C extends keyof Base[A][B],
    D extends keyof Base[A][B][C],
    E extends keyof Base[A][B][C][D],
    R extends FunctionOrDefinition<S, Base[A][B][C][D][E]>
  >(
    keys: [A, B, C, D, E],
    defaultValue?: DefinitionReturn<R>,
  ) => R;

// if you need more keys support, create PR :)

export function defineNestedFieldsSelector<
  S,
  Base,
  ResultSelector extends (
    OneKeySelector<S, Base> &
    TwoKeysSelector<S, Base> &
    ThreeKeysSelector<S, Base> &
    FourKeysSelector<S, Base> &
    FiveKeysSelector<S, Base>
  )
>(
  baseSelector: FunctionOrDefinition<S, Base>,
): ResultSelector;

export function defineNestedFieldsSelector<S>(
  baseSelector: FunctionOrDefinition<S, any>,
) {
  return (
    keys: any[],
    defaultValue?: any,
  ): any => {
    return defineSelector(
      baseSelector,
      (data) => {
        let result = data;
        for (const key of keys) {
          if (result && result[key]) {
            result = result[key];
          } else {
            return defaultValue;
          }
        }
        return result;
      },
    );
  }
}
