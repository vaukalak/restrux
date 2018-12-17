import React from 'react';
import { Context } from '../utils/propTypes';
import separateOrdered from '../observables/separateOrdered';

const connect = (stateTransformer = () => ({})) => Component =>
  class Connect extends React.Component {
    static contextTypes = Context;

    state = {};

    oldStreamMap = {};

    subscriptions = {};

    validateChildren;
    validateSelf;

    static childContextTypes = Context;

    createValidateSubscriptions() {
      const { restruxValidate } = this.context;
      if (!this.validateSelf) {
        const { first, second } = separateOrdered(restruxValidate);
        this.validateSelf = first;
        this.validateChildren = second;
      }
    }

    componentDidMount() {
      const { restruxNotify } = this.context;
      this.createValidateSubscriptions();
      this.createSubscriptions(
        stateTransformer(this.props),
        restruxNotify,
        this.validateSelf
      );
    }

    componentWillReceiveProps(nextProps) {
      const { restruxNotify, restruxValidate } = this.context;
      this.createSubscriptions(
        stateTransformer(nextProps),
        restruxNotify,
        this.validateSelf,
      );
    }

    getChildContext() {
      const { restruxNotify } = this.context;
      this.createValidateSubscriptions();
      return {
        restruxNotify,
        restruxValidate: this.validateChildren,
      };
    }

    createSubscriptions = (streamMap, restruxNotify, restruxValidate) => {
      let update;
      let unsubscribe;
      let firstRun = true;
      this.subscriptions = Object.keys(streamMap).reduce((acc, key) => {
        if (this.oldStreamMap[key] === streamMap[key]) {
          acc[key] = this.subscriptions[key];
          return acc;
        }
        const stream = streamMap[key](restruxNotify);
        acc[key] = stream.subscribe((v) => {
          if (!update) {
            update = {};
          }
          update[key] = v;
          if (!firstRun && !unsubscribe) {
            unsubscribe = restruxValidate.subscribe(
              () => {
                this.setState(update);
                update = undefined;
                unsubscribe.unsubscribe();
              },
            );
          }
        });
        return acc;
      }, {});
      this.oldStreamMap = streamMap;
      firstRun = false;
      if (update) {
        this.setState(update);
      }
    };

    render() {
      return (
        <Component
          {...this.props}
          {...this.state}
        />
      );
    }
  };

export default connect;
