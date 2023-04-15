import { Injectable } from "@angular/core";
import { ComponentStore, tapResponse } from "@ngrx/component-store";
import { delay, Observable, of, switchMap } from "rxjs";
import { LogUpdater, LogEffect, DebugToolLogLevel } from "ngx-ngrx-component-store-debug-tools"
import { LogState } from "ngx-ngrx-component-store-debug-tools";

declare const ngDevMode: boolean;

const logLevel: DebugToolLogLevel = ngDevMode ? 'debug' : 'off';

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

  @LogUpdater({ logLevel })
  readonly updateUser = this.updater((state: CardState, user: User): CardState => {
    return {
      ...state,
      user
    };
  });

  @LogUpdater({ logLevel })
  readonly updateUserWithMutation = this.updater((state: CardState, user: User): CardState => {
    state.user = user;
    return state;
  });
}

