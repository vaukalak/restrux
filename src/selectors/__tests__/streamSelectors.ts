import { createStreamSelector } from '../streamSelectors';
import { defineSelector } from '../definitions';
import { Subject } from 'rxjs';
import { ContextType } from '../../interfaces';

interface MockContext extends ContextType<any> {
  forward(): void;
  reset(): void;
}

const createMockContext = (): MockContext => {
    let maxDepth = 0;
    let currentDepth = 0;
    const depthInvalidationStream =  new Subject<number>();
    return {
        forward: () => {
            currentDepth++
            depthInvalidationStream.next(currentDepth);
        },
        reset: () => {
            maxDepth = 0;
            currentDepth = 0;
        },
        rootStream: new Subject(),
        getState() { return null },
        invalidationStream: new Subject(),
        depthInvalidationStream,
        selectorsPool: new Map(),
        addInvalidationDepth: (depth) => {
          maxDepth = Math.max(depth, maxDepth);
        },
        getCurrentInvalidationDepth: () => currentDepth,
    }
}

describe('createStreamSelector - caching', () => {

    let context: MockContext;

    beforeEach(() => {
        context = createMockContext();
    });

    it('should increment caching when created, and decrement, when unsubscribed', () => {
        const def = () => 1;
        const stream = createStreamSelector(
            def,
            context,
        )(new Subject());
        expect(context.selectorsPool.get(def)!.usages).toBe(1);
        const subscription = stream.subscribe(() => {});
        subscription.unsubscribe();
        expect(context.selectorsPool.get(def)).toBeUndefined;
    });
});

describe('createStreamSelector - tree', () => {

    let context: MockContext;

    beforeEach(() => {
        context = createMockContext();
    });

    it('should return object property', () => {
        const foo = { a: 'test-value' };
        const subject = new Subject<typeof foo>();
        const stream = createStreamSelector(
            (({ a }: typeof foo) => a),
            context,
        )(subject);
        const retrievedValues: string[] = [];
        stream.subscribe((a) => {
          retrievedValues.push(a);
        });
        expect(retrievedValues).toEqual([]);
        subject.next(foo);
        expect(retrievedValues).toEqual(['test-value']);
    });

    it('should provide consistent data to combiners', () => {
        type Foo = {
            currentId: string;
            items: {
                [key: string]: { bar: string };
            };
        };
        const foo = {
            currentId: '1',
            items: {
                '1': { bar: 'test-bar-1' },
                '2': { bar: 'test-bar-2' },
            },
        };
        const subject = new Subject<Foo>();
        const stream = createStreamSelector(
          defineSelector(
            ({ items }: Foo) => items,
            ({ currentId }) => currentId,
            (items, currentId) => {
                return items[currentId].bar;
            },
          ),
          context,
        )(subject);
        const retrievedValue: string[] = [];
        stream.subscribe(
            (a) => retrievedValue.push(a),
            (err) => { console.log('fail, bro:', err)});
        expect(retrievedValue).toEqual([]);
        subject.next(foo);
        context.forward();
        context.reset();
        subject.next({
            currentId: '3',
            items: {
                '3': { bar: 'test-bar-3' },
            },
        });
        context.forward();
        context.reset();
        expect(retrievedValue).toEqual(['test-bar-1', 'test-bar-3']);
    });
});