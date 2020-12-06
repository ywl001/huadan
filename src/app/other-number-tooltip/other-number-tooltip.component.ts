import { Component } from '@angular/core';
import { Model } from '../models/Model';
import {ITooltipAngularComp} from 'ag-grid-angular'
import { ITooltipParams } from 'ag-grid-community';
import { HostBinding } from '@angular/core';

@Component({
  selector: 'app-other-number-tooltip',
  templateUrl: './other-number-tooltip.component.html',
  styleUrls: ['./other-number-tooltip.component.css']
})
export class OtherNumberTooltipComponent implements ITooltipAngularComp {

  num = '';
  insertTime = ''
  name = '';

  @HostBinding('style.display') isShow:string = 'block';

  agInit(params:ITooltipParams ): void {
    // console.log('tooltip...',params);
    let data = params.data;

    if(data && data[Model.CONTACT]){
      this.isShow = 'block';
      this.name = data[Model.CONTACT].name
      this.num = data[Model.OTHER_NUMBER];
      this.insertTime = data[Model.CONTACT][Model.INSERT_TIME].substr(0, 10)+'添加';
    }else{
      this.isShow = 'none';
    }
  }

}
