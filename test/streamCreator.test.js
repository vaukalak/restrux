import { Observable } from 'rxjs';
import mapAndMemoize from '../lib/observables/mapAndMemoize';

let dispatch;

const createObservable = () => {
  const observers = [];
  let currentValue;
  dispatch = (v) => {
    currentValue = v;
    observers.forEach((o) => {
      o.next(v);
    });
  };
  return Observable.create((observer) => {
    observer.next(currentValue);
    observers.push(observer);
  });
};

describe('streamCreator', () => {
  it('should cache previous value', () => {
    const observable = createObservable();

    dispatch({ x: 1 });

    const stream = mapAndMemoize(observable, ({ x }) => x);
    const arr = [];
    stream.subscribe((v) => {
      arr.push(v);
    });
    dispatch({ x: 1 });
    dispatch({ x: 2 });
    expect(arr).toEqual([1, 2]);
  });

  it('full fill all observers', () => {
    const observable = createObservable();

    dispatch({ x: 1 });

    const st1 = mapAndMemoize(observable, ({ x }) => x);
    const st2 = mapAndMemoize(observable, ({ x }) => x);

    const arr1 = [];
    st1.subscribe((x) => {
      arr1.push(x * 2);
    });

    const arr2 = [];
    st2.subscribe((x) => {
      arr2.push(x * 2);
    });

    dispatch({ x: 1 });
    dispatch({ x: 2 });

    expect(arr1).toEqual([2, 4]);
    expect(arr2).toEqual([2, 4]);
  });

  it('should provide current state', () => {
    const observable = createObservable();

    dispatch({ x: 1 });

    const st1 = mapAndMemoize(observable, ({ x }) => x);

    const arr1 = [];
    st1.subscribe((x) => {
      arr1.push(x * 2);
    });

    dispatch({ x: 2 });

    expect(arr1).toEqual([2, 4]);
  });

  it('full fill nested observers', () => {
    const observable = createObservable();

    dispatch({ x: 1 });

    const st1 = mapAndMemoize(observable, ({ x }) => x);
    const st2 = mapAndMemoize(st1, x => x * 2);

    const arr1 = [];
    st1.subscribe((x) => {
      arr1.push(x);
    });

    const arr2 = [];
    st2.subscribe((x) => {
      arr2.push(x);
    });

    dispatch({ x: 1 });
    dispatch({ x: 2 });

    expect(arr1).toEqual([1, 2]);
    expect(arr2).toEqual([2, 4]);
  });
});
