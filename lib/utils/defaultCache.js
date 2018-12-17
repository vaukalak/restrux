const defaultCache = (key, value) => testKey => (
  key === testKey ? value : undefined
);

export default defaultCache;
