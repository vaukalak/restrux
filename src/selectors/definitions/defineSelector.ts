export type SelectorDefinition<S, R> = {
    selectors: FunctionOrDefinition<S, any>[],
    combiner: (...args: any[]) => R,
  };
  
export type FunctionOrDefinition<S, R> = SelectorDefinition<S, R> | ((state: S) => R);

// combiner only
export function defineSelector<S, T>(
  combiner: (state: S) => T,
): { selectors: [], combiner: typeof combiner };

// one selector
export function defineSelector<S, A, T>(
  selectorA: FunctionOrDefinition<S, A>,
  combiner: (a: A) => T,
): { selectors: [typeof selectorA], combiner: typeof combiner };

// two selectors
export function defineSelector<S, A, B, T>(
  selectorA: FunctionOrDefinition<S, A>,
  selectorB: FunctionOrDefinition<S, B>,
  combiner: (a: A, b: B) => T,
): { selectors: [typeof selectorA, typeof selectorB], combiner: typeof combiner };

// three selectors
export function defineSelector<S, A, B, C, T>(
    selectorA: FunctionOrDefinition<S, A>,
    selectorB: FunctionOrDefinition<S, B>,
    selectorC: FunctionOrDefinition<S, C>,
    combiner: (a: A, b: B, c: C) => T,
  ): {
    selectors: [typeof selectorA, typeof selectorB, typeof selectorC],
    combiner: typeof combiner,
  };
  
// four selectors
export function defineSelector<S, A, B, C, D, T>(
  selectorA: FunctionOrDefinition<S, A>,
  selectorB: FunctionOrDefinition<S, B>,
  selectorC: FunctionOrDefinition<S, C>,
  selectorD: FunctionOrDefinition<S, D>,
  combiner: (a: A, b: B, c: C, d: D) => T,
): {
  selectors: [typeof selectorA, typeof selectorB, typeof selectorC, typeof selectorD],
  combiner: typeof combiner,
};

// five selectors
export function defineSelector<S, A, B, C, D, E, T>(
  selectorA: FunctionOrDefinition<S, A>,
  selectorB: FunctionOrDefinition<S, B>,
  selectorC: FunctionOrDefinition<S, C>,
  selectorD: FunctionOrDefinition<S, D>,
  selectorE: FunctionOrDefinition<S, E>,
  combiner: (a: A, b: B, c: C, d: D, e: E) => T,
): {
  selectors: [typeof selectorA, typeof selectorB, typeof selectorC, typeof selectorD, typeof selectorE],
  combiner: typeof combiner,
};

// six selectors
export function defineSelector<S, A, B, C, D, E, F, T>(
  selectorA: FunctionOrDefinition<S, A>,
  selectorB: FunctionOrDefinition<S, B>,
  selectorC: FunctionOrDefinition<S, C>,
  selectorD: FunctionOrDefinition<S, D>,
  selectorE: FunctionOrDefinition<S, E>,
  selectorF: FunctionOrDefinition<S, F>,
  combiner: (a: A, b: B, c: C, d: D, e: E, f: F) => T,
): {
  selectors: [typeof selectorA, typeof selectorB, typeof selectorC, typeof selectorD, typeof selectorE, typeof selectorF],
  combiner: typeof combiner,
};

// seven selectors
export function defineSelector<S, A, B, C, D, E, F, G, T>(
  selectorA: FunctionOrDefinition<S, A>,
  selectorB: FunctionOrDefinition<S, B>,
  selectorC: FunctionOrDefinition<S, C>,
  selectorD: FunctionOrDefinition<S, D>,
  selectorE: FunctionOrDefinition<S, E>,
  selectorF: FunctionOrDefinition<S, F>,
  selectorG: FunctionOrDefinition<S, G>,
  combiner: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => T,
): {
  selectors: [typeof selectorA, typeof selectorB, typeof selectorC, typeof selectorD, typeof selectorE, typeof selectorF, typeof selectorG],
  combiner: typeof combiner,
};

// eight selectors
export function defineSelector<S, A, B, C, D, E, F, G, H, T>(
  selectorA: FunctionOrDefinition<S, A>,
  selectorB: FunctionOrDefinition<S, B>,
  selectorC: FunctionOrDefinition<S, C>,
  selectorD: FunctionOrDefinition<S, D>,
  selectorE: FunctionOrDefinition<S, E>,
  selectorF: FunctionOrDefinition<S, F>,
  selectorG: FunctionOrDefinition<S, G>,
  selectorH: FunctionOrDefinition<S, H>,
  combiner: (a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H) => T,
): {
  selectors: [typeof selectorA, typeof selectorB, typeof selectorC, typeof selectorD, typeof selectorE, typeof selectorF, typeof selectorG, typeof selectorH],
  combiner: typeof combiner,
};

// if you really need more, create PR ;)

export function defineSelector(...args: any[]) {
  const selectors = args.concat();
  const combiner = selectors.pop();
  return { selectors, combiner };
}
