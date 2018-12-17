import * as enzyme from 'enzyme';
import { createStore } from 'redux';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Context } from '../../../lib/utils/propTypes';
import connect from '../../../lib/hocs/connect';
import selector from '../../../lib/selectors/selector';
import rootObservables from '../../../lib/observables/rootObservables';
import createCombinedObservable from '../../../lib/selectors/createCombinedObservable';
import cachedFunction from '../../../lib/selectors/cachedFunction';

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

    const selectItems = selector(
      ({ items }) => items,
    );

    const selectItemById = cachedFunction(itemId => createCombinedObservable(
      selectItems,
      items => items[itemId],
    ));

    const Wrapped = connect(
      ({ itemId }) => ({
        currentValue: selectItemById(itemId),
      }),
    )(A);

    wrapper = mount(
      <Wrapped itemId="a" />,
      {
        context: rootObservables(store),
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

    // anyway updating from redux still works.
    store.dispatch({ type: 'INC_A' });
    wrapper.update();
    expect(initialState).not.toBe(wrapper.state());
    alert = wrapper.find(A);
    expect(alert.props().currentValue).toEqual(2);
  });
});
