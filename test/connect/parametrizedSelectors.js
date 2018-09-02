import * as enzyme from 'enzyme';
import { createStore } from 'redux';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Observable } from 'rxjs/Rx';
import { Context } from '../../lib/propTypes';
import connect from '../../lib/connect';
import createStreamTransformer from '../../lib/createStreamTransformer';
import createRootObservables from '../../lib/createRootObservables';
import createCombinedObservable from '../../lib/createCombinedObservable';


const { mount } = enzyme;
enzyme.configure({ adapter: new Adapter() });

describe('parametrized selectors', () => {
  const A = () => null;
  let store;
  let wrapper;

  beforeEach(() => {
    store = createStore(
      (state, { type, payload }) => {
        switch (type) {
          case 'INC_A':
            return {
              ...state,
              items: {
                ...state.items,
                a: state.items.a + 1,
              },
            };
          case 'INC_B':
            return {
              ...state,
              items: {
                ...state.items,
                b: state.items.b + 1,
              },
            };
          default:
            return state;
        }
      },
      {
        items: {
          a: 1,
          b: 200,
        },
        currentItem: 'a',
      },
    );

    const selectItems = createStreamTransformer(
      ({ items }) => items
    );

    const cachedFunction = (cb) => {
      let oldArgs = [];
      const initial = {};
      let oldResult = initial;
      return (...args) => {
        if (
          oldResult === initial ||
          args.length !== oldArgs.length ||
          args.find((a, i) => a !== oldArgs[i])
        ) {
          oldArgs = args;
          oldResult = cb(...args);
          return oldResult;
        }
        return oldResult;
      };
    };

    const selectItemById = cachedFunction((itemId) => {
      return createCombinedObservable(
        selectItems,
        (items) => items[itemId],
      );
    });

    const Wrapped = connect(
      ({ itemId }) => ({
        currentValue: selectItemById(itemId),
      }),
    )(A);

    wrapper = mount(
      <Wrapped itemId="a" />,
      {
        context: createRootObservables(store),
        childContextTypes: Context,
      },
    );
  });

  it('should receive properties on mount', () => {
    const alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(1);
  });

  it('should update props on dispatch', () => {
    let alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(1);
    store.dispatch({ type: 'INC_A' });
    wrapper.update();
    alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(2);
  });

  it('should only update for expected keys', () => {
    const initialState = wrapper.state();
    store.dispatch({ type: 'INC_B' });
    expect(initialState).toBe(wrapper.state());
    store.dispatch({ type: 'INC_A' });
    wrapper.update();
    expect(initialState).not.toBe(wrapper.state());
    const alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(2);
  });

  it('react on property change', () => {
    let alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(1);
    wrapper.setProps({ itemId: 'b' });
    wrapper.update();
    alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(200);
  });

  it('dont re-render if dependency properties are not updated', () => {
    let alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(1);
    const initialState = wrapper.state();
    wrapper.setProps({ foo: 'b' });
    wrapper.update();
    expect(initialState).toBe(wrapper.state());
  });
});
