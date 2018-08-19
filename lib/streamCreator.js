import { Observable } from 'rxjs/Rx';

const INITIAL_VALUE = {};

const streamCreator = (observable, transform) => {
  let oldValue = INITIAL_VALUE;
  const observers = [];

  const noRepeatObservable = observable
    .map(transform)
    .filter((value) => {
      if (value === oldValue) {
        return false;
      }
      oldValue = value;
      return true;
    });

  noRepeatObservable.subscribe((value) => {
    observers.forEach(
      (o) => { o.next(value); },
    );
  });

  return Observable.create(
    (observer) => {
      observers.push(observer);
      observer.next(oldValue);
      return () => {
        observers.splice(observers.indexOf(observer), 1);
      };
    },
  );
};

export default streamCreator;
