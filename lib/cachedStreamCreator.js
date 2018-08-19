import streamCreator from './streamCreator';

const cachedStreamCreatorBase = (cache, transform) => {
  let cached = cache();
  return (observable) => {
    if (!cached(observable)) {
      cached = cache(
        observable,
        streamCreator(observable, transform),
      );
    }
    return cached(observable);
  };
};

const cachedStreamCreator = cache => transform => cachedStreamCreatorBase(cache, transform);

export default cachedStreamCreator;
