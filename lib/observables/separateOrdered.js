/**
 *
 * used to guarantee invocation order. component should be
 * invalidated prior to it's children.
 *
 */
import createLazy from './createLazy';

const separateOrdered = (observable) => {
  const first = createLazy();
  const second = createLazy();
  observable.subscribe((value) => {
    first.next(value);
    second.next(value);
  });
  return {
    first: first.observable,
    second: second.observable,
  }
};

export default separateOrdered;
