import { Observable } from 'rxjs/Rx';
import createLazy from './createLazy';

const rootObservables = (store) => {
  const notifyObservers = [];
  const restruxNotify = Observable.create(
    (observer) => {
      notifyObservers.push(observer);
      observer.next(store.getState());
      return () => {
        notifyObservers.splice(notifyObservers.indexOf(observer), 1);
      };
    },
  );

  const {
    observable: restruxValidate,
    next: validateComponents,
  } = createLazy();

  store.subscribe(() => {
    const state = store.getState();
    notifyObservers.forEach((o) => { o.next(state); });
    validateComponents();
  });

  return {
    restruxNotify,
    restruxValidate,
  };
};

export default rootObservables;
