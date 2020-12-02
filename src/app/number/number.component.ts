import { Component, OnInit } from '@angular/core';
import { DbService } from '../services/db.service';

import * as EventBus from 'eventbusjs'
import { EventType } from '../models/event-type';

@Component({
  selector: 'app-number',
  templateUrl: './number.component.html',
  styleUrls: ['./number.component.css']
})
export class NumberComponent implements OnInit {

  title = '请输入查询的号码：'
  constructor(private dbService:DbService) { }

  lable: string='查询号码'
  value: string;
  type: string = 'text'

  ngOnInit() {
  }

  onSubmit() {
    this.dbService.getRecordsByNumber(this.value)
    .done(
      res=>{
        console.log(res);
        // EventBus.dispatch(EventType.)
        EventBus.dispatch(EventType.SHOW_SEARCH_RECORDS, res);
      }
    )
  }

}
