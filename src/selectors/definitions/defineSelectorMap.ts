import {
  defineSelector,
  SelectorDefinition,
  FunctionOrDefinition,
} from './defineSelector';

export type DefinitionReturn<Type> = Type extends FunctionOrDefinition<infer S, infer R> ? R : never;

export function defineSelectorMap<
  S,
  K extends keyof MAP,
  MAP = { [key in K]: FunctionOrDefinition<S, any> },
>(selectorsMap: MAP) {
  const keys = Object.keys(selectorsMap);
  // @ts-ignore
  const selectors = keys.map((key: string) => selectorsMap[key]);
  const combiner = (...values: any[]) => keys.reduce(
    (acc: { [key: string]: any }, key, index) => {
      acc[key] = values[index];
      return acc;
    },
    {},
  );

  type ReturnMap = {
    [key in keyof MAP]: DefinitionReturn<MAP[key]>
  };
  type ReturnValue = SelectorDefinition<S, ReturnMap>;
  const definition = defineSelector(
    ...selectors,
    //@ts-ignore
    combiner,
  );
  return definition as ReturnValue;
}
