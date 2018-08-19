import * as enzyme from 'enzyme';
import { createStore } from 'redux';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Observable } from 'rxjs/Rx';
import PropTypes from 'prop-types';
import connect from '../../lib/connect';
import createStreamTransformer from '../../lib/createStreamTransformer';
import createLazyObservable from '../../lib/createLazyObservable';


const { mount } = enzyme;
enzyme.configure({ adapter: new Adapter() });

describe('base scenarios', () => {
  const A = () => null;
  let store;
  let wrapper;

  beforeEach(() => {
    store = createStore(
      (state, { type }) => {
        switch (type) {
          case 'A':
            return {
              ...state,
              a: state.a + 1,
            };
          case 'C':
            return {
              ...state,
              c: state.c + 1,
            };
          default:
            return state;
        }
      },
      {
        a: 1,
        b: 2,
        c: 3,
      },
    );

    const Wrapped = connect(
      () => ({
        a: createStreamTransformer(({ a }) => a),
        b: createStreamTransformer(({ b }) => b),
      }),
    )(A);

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
    } = createLazyObservable();

    store.subscribe(() => {
      const state = store.getState();
      notifyObservers.forEach((o) => { o.next(state); });
      validateComponents();
    });

    wrapper = mount(
      <Wrapped />,
      {
        context: {
          restruxNotify,
          restruxValidate,
        },
        childContextTypes: {
          restruxNotify: PropTypes.object,
          restruxValidate: PropTypes.object,
        }
      },
    );
  });

  it('should receive properties on mount', () => {
    const alert = wrapper.find(A);
    expect(alert.props().a).toEqual(1);
    expect(alert.props().b).toEqual(2);
  });

  it('should update store on dispatch', () => {
    let alert = wrapper.find(A);
    expect(alert.props().a).toEqual(1);
    expect(alert.props().b).toEqual(2);
    store.dispatch({ type: 'A' });
    wrapper.update();
    alert = wrapper.find(A);
    expect(alert.props().a).toEqual(2);
  });

  it('should only update for expected keys', () => {
    let alert = wrapper.find(A);
    const initialState = wrapper.state();
    store.dispatch({ type: 'C' });
    expect(initialState).toBe(wrapper.state());
    store.dispatch({ type: 'A' });
    wrapper.update();
    expect(initialState).not.toBe(wrapper.state());
    alert = wrapper.find(A);
    expect(alert.props().a).toEqual(2);
  });
});
