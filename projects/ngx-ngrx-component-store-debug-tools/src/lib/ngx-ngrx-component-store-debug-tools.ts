import { isObservable, Observable, Subject, Subscription } from "rxjs";
import { getDiff } from 'recursive-diff';

let storeId = 0;

type LogLevel = 'log' | 'info' | 'debug' | 'trace' | 'off' | undefined;

interface LoggerParams {
  logLevel: LogLevel;
}

function decorateWithLogger(params: LoggerParams, type: 'updater' | 'effect') {
  return function(target: any, propertyKey: string) {
    if (!params?.logLevel || params?.logLevel === 'off') {
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
  return decorateWithLogger(params, 'updater');
}

export function LogEffect(params: LoggerParams) {
  return decorateWithLogger(params, 'effect');
}

export function LogObservable(groupMessage: string, observable: Observable<any>, initialState: any, logLevel: LogLevel = 'log'): Subscription | undefined {
  if (!logLevel || logLevel === 'off') {
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

export function LogState(params: LoggerParams) {
  return (ctr: any) => {
      if (!params?.logLevel || params?.logLevel === 'off') {
      return ctr;
    }

    const storeName = ctr.name;

    return new Proxy(ctr, {
      construct(c, args) {
        storeId ++;
        const storeIdString = ("#000" + storeId).slice(-4);    

        const store = Reflect.construct(c, args);

        store._debugStoreId = storeIdString;

        store._debugSubscription = LogObservable(`${storeName}.state$ (${storeIdString})`, store.state$ as Observable<any>, {}, params.logLevel);

        const originalNgOnDestroy = store.ngOnDestroy;
        store.ngOnDestroy = function(...ngOnDestroyArgs: any[]) {
          originalNgOnDestroy.apply(this), ngOnDestroyArgs;
          this._debugSubscription?.unsubscribe();
        };
        
        return store;
      }
    });
  }  
}