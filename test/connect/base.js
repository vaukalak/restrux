import * as enzyme from 'enzyme';
import { createStore } from 'redux';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Observable } from 'rxjs/Rx';
import { Context } from '../../lib/propTypes';
import connect from '../../lib/connect';
import createStreamTransformer from '../../lib/createStreamTransformer';
import createRootObservables from '../../lib/createRootObservables';


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
          case 'INC_A':
            return {
              ...state,
              a: state.a + 1,
            };
          case 'INC_B':
            return {
              ...state,
              b: state.b + 1,
            };
          case 'INC_C':
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

    wrapper = mount(
      <Wrapped />,
      {
        context: createRootObservables(store),
        childContextTypes: Context,
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
    store.dispatch({ type: 'INC_A' });
    wrapper.update();
    alert = wrapper.find(A);
    expect(alert.props().a).toEqual(2);
  });

  it('should only update for expected keys', () => {
    let alert = wrapper.find(A);
    const initialState = wrapper.state();
    store.dispatch({ type: 'INC_C' });
    expect(initialState).toBe(wrapper.state());
    store.dispatch({ type: 'INC_A' });
    wrapper.update();
    expect(initialState).not.toBe(wrapper.state());
    alert = wrapper.find(A);
    expect(alert.props().a).toEqual(2);
  });
});
