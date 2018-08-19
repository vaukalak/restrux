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

describe('complex selectors', () => {
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
          case 'CHANGE_CURRENT_ITEM':
            return {
              ...state,
              currentItem: payload,
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

    const selectItems = createStreamTransformer(({ items }) => items);
    const selectCurrentItem = createStreamTransformer(({ currentItem }) => currentItem);

    const Wrapped = connect(
      () => ({
        currentValue: createCombinedObservable(
          selectItems,
          selectCurrentItem,
          (items, currentItem) => items[currentItem],
        ),
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

  it('react on currentItem change', () => {
    let alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(1);
    store.dispatch({ type: 'CHANGE_CURRENT_ITEM', payload: 'b' });
    wrapper.update();
    alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(200);
  });
});
