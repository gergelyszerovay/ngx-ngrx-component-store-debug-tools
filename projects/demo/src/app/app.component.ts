import { OnDestroy } from '@angular/core';
import { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LogObservable } from 'ngx-ngrx-component-store-debug-tools';
import { Subscription } from 'rxjs';
import { timer } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnDestroy {
  title = 'demo';
  logSubscription?: Subscription;

  constructor() {
  }

  startTimer(): void {
    const timer$ = timer(0, 1000);
    this.logSubscription = LogObservable('timer$', timer$, 0);
  }

  stopTimer(): void {
    this.logSubscription?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
