import { Component } from '@angular/core';
import {ITooltipAngularComp} from 'ag-grid-angular'
import { ITooltipParams } from 'ag-grid-community';
import { HostBinding } from '@angular/core';
import { Field } from '../models/field';

@Component({
  selector: 'app-other-number-tooltip',
  templateUrl: './other-number-tooltip.component.html',
  styleUrls: ['./other-number-tooltip.component.css']
})
export class OtherNumberTooltipComponent implements ITooltipAngularComp {

  num = '';
  insertTime = ''
  name = '';

  //设置主机组件是否显示，如果没有联系人信息，就不用显示了
  @HostBinding('style.display') isShow:string = 'block';

  agInit(params:ITooltipParams ): void {
    // console.log('tooltip...',params);
    let data = params.data;

    if(data && data[Field.CONTACT]){
      this.isShow = 'block';
      this.name = data[Field.CONTACT].name
      this.num = data[Field.OTHER_NUMBER];
      this.insertTime = data[Field.CONTACT][Field.INSERT_TIME].substr(0, 10)+'添加';
    }else{
      this.isShow = 'none';
    }
  }

}
