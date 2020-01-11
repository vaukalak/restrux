import { Observable, ObservableLike } from 'rxjs';
import { FunctionOrDefinition } from './selectors';

export interface Store<S> {
    subscribe: (listener: () => void) => () => void;
    getState(): S;
  }
  
export interface ProviderProps<S> {
  children: React.ReactElement;
  store: Store<S>;
}

export type SelectorsPoolEntry<R> = {
  observable: SelectorObservable<R>;
  usages: number;
};

export interface SelectorObservable<T> extends Observable<T> {
  depth: number;
}

export type SelectorsPool<S, R = any> = Map<
  FunctionOrDefinition<S, R>,
  SelectorsPoolEntry<R>
>;

export type ContextType<S> = {
  rootStream: Observable<S>;
  getState(): S;
  getCurrentInvalidationDepth(): number;
  addInvalidationDepth(depth: number): void;
  depthInvalidationStream: Observable<number>;
  invalidationStream: Observable<void>;
  selectorsPool: SelectorsPool<S>;
};
