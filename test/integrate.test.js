import { createStore, combineReducers } from 'redux';
import { Observable } from 'rxjs';
import mapAndMemoize from '../lib/observables/mapAndMemoize';

describe('foo', () => {
  it('should log', () => {
    const FOO_A = 'FOO_A';
    const FOO_B = 'FOO_B';
    const BAR = 'BAR';

    const foo = (state = { a: 0, b: 0 }, { type }) => {
      switch (type) {
        case FOO_A:
          return {
            ...state,
            a: state.a + 1,
          };
        case FOO_B:
          return {
            ...state,
            b: state.b + 1,
          };
        default:
          return state;
      }
    };
    const bar = (s = 0, { type }) => (type === BAR ? s + 1 : s);

    const reducer = combineReducers({
      foo, bar,
    });

    const store = createStore(reducer);

    const observable = Observable.from(store);

    const observeFoo = mapAndMemoize(
      observable,
      s => s.foo,
    );
    const observeFooA = mapAndMemoize(
      observeFoo,
      fooValue => fooValue.a,
    );
    const observeFooB = mapAndMemoize(
      observeFoo,
      fooValue => fooValue.b,
    );
    const observerBar = mapAndMemoize(
      observable,
      s => s.bar,
    );

    const outputs = [];

    const subFoo = observeFoo.subscribe((v) => {
      outputs.push(['foo', v]);
    });

    const subFooA = observeFooA.subscribe((v) => {
      outputs.push(['foo.a', v]);
    });

    observeFooB.subscribe((v) => {
      outputs.push(['foo.b', v]);
    });

    observerBar.subscribe((v) => {
      outputs.push(['bar', v]);
    });

    store.dispatch({ type: FOO_A });

    subFooA.unsubscribe();
    subFoo.unsubscribe();

    store.dispatch({ type: FOO_A });

    expect(outputs).toEqual([
      ['foo', { a: 0, b: 0 }],
      ['foo.a', 0],
      ['foo.b', 0],
      ['bar', 0],
      ['foo.a', 1],
      ['foo', { a: 1, b: 0 }],

    ]);
  });
});
