import React from 'react';
import { Context } from './propTypes';

const connect = (stateTransformer = () => ({})) => Component =>
  class Connect extends React.Component {
    static contextTypes = Context;

    state = {};

    componentDidMount() {
      const { restruxNotify, restruxValidate } = this.context;
      const streamMap = stateTransformer();
      const streams = Object.keys(streamMap).reduce(
        (acc, key) => {
          acc[key] = streamMap[key](restruxNotify);
          return acc;
        },
        {},
      );
      let update;
      let unsubscribe;
      let firstRun = true;
      Object.keys(streams).forEach((key) => {
        streams[key].subscribe((v) => {
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
      });
      firstRun = false;
      this.setState(update);
    }

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
