import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as EventBus from 'eventbusjs';
import { EventType } from '../models/event-type';
import { Model } from '../models/Model';
import { DbService } from '../services/db.service';
import * as toastr from 'toastr'

@Component({
  selector: 'app-add-lbs-location',
  templateUrl: './add-lbs-location.component.html',
  styleUrls: ['./add-lbs-location.component.css']
})
export class AddLbsLocationComponent implements OnInit {

  title = '添加LBS点位的位置'
  //注入的data包含lac，ci，isHasLocation;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AddLbsLocationComponent>,
    private dbService: DbService
  ) { }

  ngOnInit() {
  }

  onSubmit() {
    //修改本地
    this.dbService.updateLbsLocation(Model.currentTable, this.data.lac, this.data.ci, this.data.lat, this.data.lng,
      (tx, res) => {
        const rowsAffected = res.rowsAffected;
        if (rowsAffected === 0) {
          toastr.error('修改失败');
        } else {
          toastr.info(`添加经纬度成功，共修改${rowsAffected}条记录`);
          //视图刷新
          //1 更新Model存储所有 
          let allRecords = Model.allRecords;
          let recordsMap = Model.allRecordsMap;
          let len = allRecords.length;
          recordsMap.clear();
          for (let i = 0; i < len; i++) {
            let r = allRecords[i];
            if (r.lac == this.data.lac && r.ci == this.data.ci) {
              r.lat = this.data.lat;
              r.lng = this.data.lng;
            }
            recordsMap.set(r.id, r)
          }
          //2 更新视图
          let gridData = this.data.gridData;
          for (let i = 0; i < gridData.length; i++) {
            const r = gridData[i];
            if (r.lac == this.data.lac && r.ci == this.data.ci) {
              r.lat = this.data.lat;
              r.lng = this.data.lng;
            }
          }
          EventBus.dispatch(EventType.SHOW_RECORDS, gridData);
        }
        (tx, err) => { console.log(err.message) }
      },
    )

    //修改远程
  }

  onCancel() {
    EventBus.dispatch(EventType.TOGGLE_MIDDLE,1)
  }
}
