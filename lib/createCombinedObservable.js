import { Observable } from 'rxjs/Rx';

const createCombinedObservable = (...transformers) => {
  const combiner = transformers.pop();
  return (observable) => {
    const values = [];
    const observers = [];
    const sources = transformers.map(t => t(observable));
    let activeResult;
    sources.forEach(
      (stream, index) => {
        stream.subscribe((value) => {
          values[index] = value;
          const newResult = combiner(...values);
          if (newResult !== activeResult) {
            activeResult = newResult;
            observers.forEach((o) => {
              o.next(activeResult);
            });
          }
        });
      },
    );
    return Observable.create((observer) => {
      observers.push(observer);
      observer.next(activeResult);
      return () => {
        observers.splice(observers.indexOf(observer), 1);
      };
    });
  };
};

export default createCombinedObservable;
