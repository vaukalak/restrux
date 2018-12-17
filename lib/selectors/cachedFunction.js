const cachedFunction = (cb) => {
  let oldArgs = [];
  const initial = {};
  let oldResult = initial;
  return (...args) => {
    if (
      oldResult === initial
      || args.length !== oldArgs.length
      || args.find((a, i) => a !== oldArgs[i])
    ) {
      oldArgs = args;
      oldResult = cb(...args);
      return oldResult;
    }
    return oldResult;
  };
};

export default cachedFunction;
