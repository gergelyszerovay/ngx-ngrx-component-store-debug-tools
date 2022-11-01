# Debug decorators and utilities for [@ngrx/component-store](https://ngrx.io/guide/component-store) 

## Try out the demo app 

### On StackBlitz

Open the console to see the logs:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/gergelyszerovay/ngx-ngrx-component-store-debug-tools-demo)

### Locally

Clone the repo, then `ng serve demo`

## Installation

### NPM

`npm install ngx-ngrx-component-store-debug-tools`

### Yarn

`yarn add ngx-ngrx-component-store-debug-tools --dev`

## Usage

The demo app has three `Card` component, each has its own Store instance.

### `@LogState` decorator

After every state change, this decorator displays the current state of the store and the changes since the last state change.

```ts
const logLevel = 'debug';

export interface User {
  name: string | null
}

export interface CardState {
  user: User
}

@Injectable()
@LogState({ logLevel })
export class CardStore extends ComponentStore<CardState> {

  constructor() {
    super({
      user: {
        name: null
      }
    });
  }

  readonly updateUser = this.updater((state: CardState, user: User): CardState => {
    return {
      ...state,
      user
    };
  });
}
```

When the component creates this store, the decorator shows its initial state:

![console](https://raw.githubusercontent.com/gergelyszerovay/ngx-ngrx-component-store-debug-tools/master/.github/images/1-empty.png)

After we call `store.updateUser({ user: 'Ben' })`, the decorator shows the new state and the diff:

![console](https://raw.githubusercontent.com/gergelyszerovay/ngx-ngrx-component-store-debug-tools/master/.github/images/2-ben.png)

### `@LogUpdater` decorator

This decorator shows the parameter of an updater on the console:

```ts
  @LogUpdater({ logLevel })
  readonly updateUser = this.updater((state: CardState, user: User): CardState => {
    return {
      ...state,
      user
    };
  });
```

After we call `store.updateUser({ user: 'Ben' })`, the decorator logs the updater call and its parameter on the console:

![console](https://raw.githubusercontent.com/gergelyszerovay/ngx-ngrx-component-store-debug-tools/master/.github/images/3-updater.png)

### `@LogEffect` decorator

This decorator shows the trigger of an effect on the console.

```ts
  protected fakeServiceFetchUser$(id: number): Observable<User> {
    return of({
      name: 'Frank'
    }).pipe(delay(1000));
  } 

  @LogEffect({ logLevel })
  readonly fetchUserFromServer = this.effect((id$: Observable<number>) => {
    return id$.pipe(
      switchMap((id) => this.fakeServiceFetchUser$(id).pipe(
        tapResponse(
          (user) => this.updateUser(user),
          (error: unknown) => console.error(error),
        ),
      )),
    );
  });
```

After we call `store.fetchUserFromServer(1)`, the decorator logs the effect call and its parameter on the console:

![console](https://raw.githubusercontent.com/gergelyszerovay/ngx-ngrx-component-store-debug-tools/master/.github/images/4-effect.png)

Since the effect calls the updater, the updater call and the state change are also visible.

### Store IDs

If we use a separate store for every component instance and create multiple component instances, each of them has an unique id (`0001`, `0002`, `0003`):

![console](https://raw.githubusercontent.com/gergelyszerovay/ngx-ngrx-component-store-debug-tools/master/.github/images/5-multi.png)

### Log levels

The following [console log levels](https://developer.mozilla.org/en-US/docs/Web/API/Console/log) are supported, adjustable by the decorator's `logLevel` parameter:

- `'log'` 
- `'info'` 
- `'debug'` 
- `'trace'` 
- `'off'` and `undefined`: these turns off the logging
