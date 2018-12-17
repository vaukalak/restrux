import * as enzyme from 'enzyme';
import { createStore } from 'redux';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import connect from '../../../lib/hocs/connect';
import selector from '../../../lib/selectors/selector';
import createCombinedObservable from '../../../lib/selectors/createCombinedObservable';
import cachedFunction from '../../../lib/selectors/cachedFunction';
import rootObservables from '../../../lib/observables/rootObservables';
import {Context} from '../../../lib/utils/propTypes';

const { mount } = enzyme;
enzyme.configure({ adapter: new Adapter() });

describe('parent subscriptions', () => {
  let store;
  let wrapper;
  let invocations;

  const selectItems = selector(
    ({ items }) => items
  );
  const selectItemById = cachedFunction(itemId => createCombinedObservable(
    selectItems,
    items => items[itemId],
  ));

  const createUpdatableWrapper = (itemId) => connect(
    () => ({
      currentValue: selectItemById(itemId),
    }),
  )(class extends React.PureComponent {
    render() {
      invocations.push(this.props.id);
      return (
        <div>
          {this.props.children || null}
        </div>
      );
    }
  });

  beforeEach(() => {

    invocations = [];

    store = createStore(
      (state, { type }) => {
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
          case 'INC_C':
            return {
              ...state,
              items: {
                ...state.items,
                c: state.items.c + 1,
              },
            };
          default:
            return state;
        }
      },
      {
        items: {
          a: 0,
          b: 10,
          c: 20,
        },
      },
    );

    const A = createUpdatableWrapper('a');
    const B = createUpdatableWrapper('b');
    const C = createUpdatableWrapper('c');

    wrapper = mount(
      <A id={'root'}>
        <A id={'aParent'}>
          <B id={'bParent'}>
            <B id={'bChild'} />
          </B>
        </A>
        <C id={'cParent'}>
          <C id={'cChild'}/>
        </C>
      </A>,
      {
        context: rootObservables(store),
        childContextTypes: Context,
      },
    );
  });

  it('should update from parent to child', () => {
    invocations = [];
    store.dispatch({ type: 'INC_A' });
    wrapper.update();
    expect(invocations).toEqual([
      'root',
      'aParent',
    ]);
    // invocations = [];
    // store.dispatch({ type: 'B' });
    // expect(invocations).toEqual([
    //   'bParent',
    //   'bChild',
    // ]);
  });
});
