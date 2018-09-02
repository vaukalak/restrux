import React from 'react';
import { Context } from './propTypes';

const connect = (stateTransformer = () => ({})) => Component =>
  class Connect extends React.Component {
    static contextTypes = Context;

    state = {};

    createStreams = (streamMap, restruxNotify) =>
      Object.keys(streamMap).reduce(
        (acc, key) => {
          acc[key] = streamMap[key](restruxNotify);
          return acc;
        },
        {},
      );

    createSubscriptions = (streams, restruxValidate) => {
      let update;
      let unsubscribe;
      let firstRun = true;
      this.subscriptions = {};
      Object.keys(streams).forEach((key) => {
        this.subscriptions[key] = streams[ key ].subscribe((v) => {
          if (!update) {
            update = {};
          }
          update[ key ] = v;
          if (!firstRun && !unsubscribe) {
            unsubscribe = restruxValidate.subscribe(
              () => {
                this.setState(update);
                update = undefined;
                unsubscribe.unsubscribe();
              },
            );
          }
        })
      });
      firstRun = false;
      if (update) {
        this.setState(update);
      }
    };

    componentDidMount() {
      const { restruxNotify, restruxValidate } = this.context;
      const streamMap = stateTransformer(this.props);
      const streams = this.createStreams(streamMap, restruxNotify);
      this.createSubscriptions(streams, restruxValidate);
    }

    componentWillReceiveProps(nextProps) {
      const { restruxNotify, restruxValidate } = this.context;
      console.log('nextProps: ', nextProps);
      const streamMap = stateTransformer(nextProps);
      // this.subscriptions.forEach()
      const streams = this.createStreams(streamMap, restruxNotify);
      this.createSubscriptions(streams, restruxValidate);
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
