import PropTypes from 'prop-types';

export const Subscription = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
});

export const Context = {
  restruxNotify: PropTypes.object,
  restruxValidate: PropTypes.object,
};
