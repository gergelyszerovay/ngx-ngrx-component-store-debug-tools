import { isObservable, Observable, Subject, Subscription } from "rxjs";
import { getDiff } from 'recursive-diff';

declare const ngDevMode: boolean;

declare const beforeEach: unknown;
declare const afterEach: unknown;
declare const describe: unknown;

const ngTestMode =
  (typeof(beforeEach) === 'function') &&
  (typeof(afterEach) === 'function') &&
  (typeof(describe) === 'function');

let storeId = 0;

export type DebugToolLogLevel = 'log' | 'info' | 'debug' | 'trace' | 'off' | undefined;

interface LoggerParams {
  logLevel?: DebugToolLogLevel;
  freeze?: boolean;
}

function decorateWithLogger(params: LoggerParams, type: 'updater' | 'effect') {
  return function(target: any, propertyKey: string) {
    if (!params?.logLevel || params?.logLevel === 'off' || ngTestMode) {
      return;
    }

    const storeName = target.constructor.name;
    const logFn = console[params.logLevel!];
    const symbol = Symbol();

    const getter = function() {
      return this[symbol];
    };

    const setter = function(fn: any) {
      this[symbol] = function(...args: any[]) {
        const storeId = this._debugStoreId;
        if (args.length === 1) {
          const args0 = args[0]
          if (isObservable(args0)) {
            (args[0] as Subject<any>).subscribe(value => {
              logFn(`${storeName}.${propertyKey} (${storeId}) (${type}):`, value, '(from observable)');
            });
          }
          else {
            logFn(`${storeName}.${propertyKey} (${storeId}) (${type}):`, args[0]);
          }
        }
        return fn.apply(target, args);
      }
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter
    });
  };
}

export function LogUpdater(params: LoggerParams) {
  if (ngDevMode) {
    return decorateWithLogger(params, 'updater');
  }
  else {
    return (target: any, propertyKey: string) => undefined;
  }
}

export function LogEffect(params: LoggerParams) {
  if (ngDevMode) {
    return decorateWithLogger(params, 'effect');
  }
  else {
    return (target: any, propertyKey: string) => undefined;
  }
}

export function LogObservable(groupMessage: string, observable: Observable<any>, initialState: any, logLevel: DebugToolLogLevel = 'log'): Subscription | undefined {
  if (ngDevMode) {
    if (!logLevel || logLevel === 'off' || ngTestMode) {
      return undefined;
    }

    let lastState = structuredClone(initialState);

    return observable.subscribe((state: any) => {
      const logFn = console[logLevel];
      const stateClone = structuredClone(state);

      const diff = getDiff(lastState, state);
      const o: Record<string, string> = Object.fromEntries(
        diff.filter(diffResult => diffResult.path).map(diffResult =>
          [diffResult.op.toUpperCase() + ': ' + diffResult.path.join('.'), diffResult.val]
        )
      );

      console.group(groupMessage);
      logFn(stateClone);
      if (Object.keys(o).length) {
        logFn(o);
      }
      console.groupEnd();

      lastState = stateClone;
    });
  }
  else {
    return undefined;
  }
}

export function FreezeObservable(observable: Observable<any>): Subscription | undefined {
  return observable.subscribe((state: any) => {
    Freeze(state);
  });
}

export function LogState(params: LoggerParams) {
  if (ngDevMode) {
    if (ngTestMode) {
      return (ctr: any) => ctr;
    }
    return (ctr: any) => {

      const storeName = ctr.name;

      return new Proxy(ctr, {
        construct(c, args) {
          storeId ++;
          const storeIdString = ("#000" + storeId).slice(-4);

          const store = Reflect.construct(c, args);

          store._debugStoreId = storeIdString;

          if (params.freeze !== false) {
            store._freezeSubscription = FreezeObservable(store.state$ as Observable<any>);
          }
          if (!(!params?.logLevel || params?.logLevel === 'off')) {
            store._debugSubscription = LogObservable(`${storeName}.state$ (${storeIdString})`, store.state$ as Observable<any>, {}, params.logLevel);
          }

          const originalNgOnDestroy = store.ngOnDestroy;
          store.ngOnDestroy = function(...ngOnDestroyArgs: any[]) {
            originalNgOnDestroy.apply(this, ngOnDestroyArgs);
            this._freezeSubscription?.unsubscribe();
            this._debugSubscription?.unsubscribe();
          };

          return store;
        }
      });
    }
  }
  else {
    return (ctr: any) => ctr;
  }
}

// Source: https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/utils.ts
function isObjectLike(target: any): target is object {
  return typeof target === 'object' && target !== null;
}

// Source: https://github.com/ngrx/platform/blob/master/modules/store/src/meta-reducers/immutability_reducer.ts
export function Freeze(target: any) {
  Object.freeze(target);

  const targetIsFunction = typeof(target) === 'function';

  Object.getOwnPropertyNames(target).forEach((prop) => {
    // Ignore Ivy properties, ref: https://github.com/ngrx/platform/issues/2109#issuecomment-582689060
    if (prop.startsWith('ɵ')) {
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(target, prop) &&
      (targetIsFunction
        ? prop !== 'caller' && prop !== 'callee' && prop !== 'arguments'
        : true)
    ) {
      const propValue = target[prop];

      if (
        (isObjectLike(propValue) || typeof(propValue) === 'function') &&
        !Object.isFrozen(propValue)
      ) {
        Freeze(propValue);
      }
    }
  });

  return target;
}
