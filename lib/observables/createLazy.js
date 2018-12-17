/**
 *
 * this observable emit values, when called explicitly
 *
 */

import { Observable } from 'rxjs/Rx';

const createLazy = () => {
  const observers = [];
  const observable = Observable.create(
    (observer) => {
      observers.push(observer);
      return () => {
        observers.splice(observers.indexOf(observer), 1);
      };
    },
  );
  return {
    observable,
    next: (value) => {
      // avoid situation when observers array is modified
      observers.concat().forEach((o) => {
        o.next(value);
      });
    },
  };
};

export default createLazy;
