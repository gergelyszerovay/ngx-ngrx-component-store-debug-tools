import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FreezeObservable, LogObservable } from 'ngx-ngrx-component-store-debug-tools';
import { BehaviorSubject, Subscription } from 'rxjs';
import { timer } from 'rxjs';

interface demoObjectType {
  value: number;
}

const initialValue: demoObjectType = { value: 1 };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnDestroy {
  title = 'demo';
  logSubscription?: Subscription;

  demoSubject$ = new BehaviorSubject<demoObjectType>(initialValue);
  demoSubjectLogSubscription?: Subscription;
  demoSubjectFreezeSubscription?: Subscription;

  constructor() {
    this.demoSubjectLogSubscription = LogObservable('demoSubject$', this.demoSubject$, initialValue);
    this.demoSubjectFreezeSubscription = FreezeObservable(this.demoSubject$);
    this.demoSubject$.next(initialValue);
  }

  mutateDemoSubject(): void {
    const s = this.demoSubject$.subscribe(v => {
      v.value = 3;
    });
    this.demoSubject$.next({ value: 2 });
    s.unsubscribe();
  }

  startTimer(): void {
    const timer$ = timer(0, 1000);
    this.logSubscription = LogObservable('timer$', timer$, 0);
  }

  stopTimer(): void {
    this.logSubscription?.unsubscribe();
    this.demoSubjectLogSubscription?.unsubscribe();
    this.demoSubjectFreezeSubscription?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
