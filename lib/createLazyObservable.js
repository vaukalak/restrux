import { Observable } from 'rxjs/Rx';

const createLazyObservable = () => {
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
      observers.forEach((o) => { o.next(value); });
    },
  };
};

export default createLazyObservable;
