import { Component, Input, OnInit } from '@angular/core';
import { CardStore } from './card.store';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  providers: [
    CardStore
  ]
})
export class CardComponent implements OnInit {
  @Input() id!: number;

  constructor(
    protected store: CardStore
  ) { 
  }

  ngOnInit(): void {
  }

  loadBen():void {
    this.store.updateUser({
      name: 'Ben'
    });
  }

}
