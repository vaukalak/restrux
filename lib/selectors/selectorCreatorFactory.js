import mapAndMemoize from '../observables/mapAndMemoize';

const selectorCreatorFactory = cache =>
  (transform) => {
    let cached = cache();
    return (observable) => {
      if (!cached(observable)) {
        cached = cache(
          observable,
          mapAndMemoize(observable, transform),
        );
      }
      return cached(observable);
    };
  };

export default selectorCreatorFactory;
