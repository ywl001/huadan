import { ExcelService } from './../services/excel.service';
import { EventType } from './../models/event-type';
import { DbService } from './../services/db.service';
import { Component, OnInit, ViewChild } from '@angular/core';

import * as toastr from 'toastr'
import * as EventBus from 'eventbusjs'
import * as moment from 'moment';

import { CommonData } from '../models/commonData';
import { SqlService } from '../services/sql.service';
import { Router, NavigationEnd } from '@angular/router';
import { MatAccordion } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { Record } from '../models/record';
import { NumberComponent } from '../number/number.component';
import { Field } from '../models/field';


declare var alertify;
declare var gcoord;

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  // 话单列表
  tables;

  // 运营商类型
  yysList = [{ label: '移动', value: 0 }, { label: '联通', value: 1 }, { label: '电信', value: 11 }];
  private yysType; // 实际的运营商类型

  private tableName;
  isMenuDisable = false;

  private url;

  private records: Array<Record>;

  @ViewChild(MatAccordion) accordion: MatAccordion;

  constructor(
    private dbService: DbService,
    private sqlService: SqlService,
    private excelService: ExcelService,
    private router: Router,
    public dialog: MatDialog
  ) {
    // 当数据库改动时，重新载入
    EventBus.addEventListener(EventType.REFRESH_TABLE, e => { this.onRefreshTable(e) });
  }

  ngOnInit() {
    this.getTables();
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) { // 当导航成功结束时执行
        this.url = e.url;
      }
    });
  }

  // 获取话单列表
  getTables() {
    this.dbService.getTables()
      .done(tables => {
        this.tables = tables;
        CommonData.tables = tables;
        // 触发视图更新
        //this.changeDetectorRef.detectChanges();
      });
  }

  //单选按钮组运营商选择监听
  onTypeChange(type) {
    this.yysType = type.value;
    if (type.value == '电信') {
      toastr.info('电信为电信4G基站信息');
    }
    if (this.url == '/help') {
      this.router.navigateByUrl('/')
    }
  }

  //添加话单，按钮调用<input type='file'>
  onAddFile() {
    if (!this.yysType) {
      toastr.warning("请选择话单运营商!");
      return;
    }
    document.getElementById("inputFile").click();
  }

  /////////////////////////////////////////添加话单入库的步骤/////////////////////////////////////////////////////
  onFileChange(event) {
    console.time('get exceldata')
    //显示忙碌图标
    EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, true);
    const target: DataTransfer = <DataTransfer>(event.target);
    //禁止多文件
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    //获取文件名
    let fileName = target.files[0].name.split('.')[0];
    //获取文件名作为表名
    this.tableName = this.yysType.label + '_' + fileName;
    //excel文件转化为数据
    this.excelService.importFromExcel(event)
      .subscribe(
        data => {
          //清除对同一文件不触发change
          event.target.value = "";
          this.excelData = data;
          console.timeEnd('get exceldata');
        }
      )
  }

  private set excelData(data) {
    console.time("clean data")
    this.records = this.cleanExcelData(data);
    if (!this.validate(this.records)) {
      EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
      return;
    }
    console.timeEnd("clean data");

    //数据处理完成，开始创建表
    if (this.records.length > 0) {
      let fields = [Field.OTHER_NUMBER, Field.START_TIME, Field.DURATION, Field.CALL_TYPE, Field.LAC, Field.CI, Field.LAT, Field.LNG, Field.MNC, Field.ACC, Field.ADDR]
      this.createTable(this.tableName, fields)
      console.time('insert excel:')
    }
  }

  /**清洗excel数据，舍弃无用的字段，保留有用字段 */
  private cleanExcelData(excelData: any[]) {
    let records = [];
    const fieldsMap = CommonData.fieldsMap;

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      let record = new Record();
      record.mnc = this.yysType.value;
      for (const key in row) {
        let usefulField = fieldsMap.get(key);
        if (usefulField) {
          let value = row[key];
          if (value) {
            //去除空白字符
            value = value.trim();
            //清楚号码前的86或0086
            if (usefulField == Field.OTHER_NUMBER) value = this.clear86(value);
          }
          record[usefulField] = value;
        }
      }
      records.push(record);
    }

    // //lac，ci如果是16进制，转换为10进制
    if (this.isHex(records)) this.hexToBin(records)

    return records;
  }

  //清除对端号码的86或0086
  private clear86(value) {
    if (!value) return '';
    let newNum;
    if (value.length == 13 && value.substr(0, 2) == '86') {
      newNum = value.substr(2, 11);
    }
    else if (value.substr(0, 4) == '0086') {
      newNum = value.substr(4, value.length - 4);
    } else {
      newNum = value;
    }
    return newNum;
  }

  /**判断数据中的基站信息是否16进制 */
  private isHex(data: any[]) {
    const re = new RegExp('[a-f]', 'i');
    let len = data.length > 500 ? 500 : data.length;
    for (let i = 1; i < len; i++) {
      let ci = data[i].ci + '';
      if (ci && ci.search(re) > 0) {
        return true;
      }
    }
    return false;
  }

  /**转换数据中的基站信息为10进制 */
  private hexToBin(records) {
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      r.lac = parseInt(r.lac + '', 16);
      r.ci = parseInt(r.ci + '', 16);
    }
  }

  //验证数据有效性，起码有对端号码，起始时间列
  private validate(records) {
    let fields = [];
    for (const key in records[0]) {
      fields.push(key);
    }
    if (fields.indexOf(Field.OTHER_NUMBER) == -1) {
      alertify.alert(`缺少 ${Field.OTHER_NUMBER} 列，请更改列名称为对端号码`);
      return false;
    }
    if (fields.indexOf(Field.START_TIME) == -1) {
      alertify.alert(`缺少 ${Field.START_TIME} 列，请更改列名称为起始时间`);
      return false;
    }
    return true;
  }

  /**创建表 */
  private createTable(tableName: string, fields: Array<string>) {
    this.dbService.createTable(tableName, fields)
      .done(res => { this.startInsertDB() })
      .fail((tx, err) => { this.createTableFail(tx, err) })
  }

  private startInsertDB() {
    //表中包含经纬度信息
    if (this.isHasLocationData(this.records)) {
      //转换坐标后插入
      this.wgsToBd(this.records);
      let tableData = this.mapToArray(this.records)
      this.insertTableData(this.tableName, tableData)
    }
    //表中包含lbs的lac和ci信息
    else if (this.isHasLbsData(this.records)) {
      //根据lbs 获取location后插入
      console.log("有基站信息")
      let lbsMap = this.getLbsInfo(this.records);
      this.getLbsLocations(lbsMap);
    }
    //表中没有基站信息
    else {
      //直接插入
      let tableData = this.mapToArray(this.records)
      this.insertTableData(this.tableName, tableData)
    }
  }

  //插入话单数据
  private insertTableData(tableName, tableData) {
    this.dbService.insertData(tableName, tableData)
      .done(res => {
        console.timeEnd('insert excel:');
        this.getTables();
        toastr.success('话单导入成功');
        EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
      })
      .fail((tx, err) => { this.createTableFail(tx, err) })
  }

  /**map数组转成二维数组,并去除id字段，数据库id自增长无需插入 插入数据库用 */
  private mapToArray(records) {
    let arr = [];
    let fields = [];
    //获取首行
    for (const key in records[0]) {
      if (key != 'id') {
        fields.push(key);
      }
    }
    arr.push(fields);
    //获取数据行
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      let item = [];
      for (const key in record) {
        if (key != 'id')
          item.push(record[key])
      }
      arr.push(item);
    }
    return arr;
  }

  /**获取表内基站信息,保存为map对象{"lac--ci":count} */
  private getLbsInfo(records: Array<Record>) {
    let lbsMap: Map<string, number> = new Map();
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (record.lac > 0 && record.ci > 0) {
        let key = `${record.lac}--${record.ci}`;
        if (lbsMap.has(key)) {
          let value = lbsMap.get(key);
          lbsMap.set(key, value++);
        } else {
          lbsMap.set(key, 1)
        }
      }
    }
    return lbsMap;
  }

  /**获取基站的位置信息 */
  private getLbsLocations(lbsMap: Map<string, number>) {
    let sql = this.createSelectLbsLocationSql(lbsMap);
    this.sqlService.selectBySql(sql).subscribe(
      res => {
        //补充记录的位置信息
        console.log(res)
        for (let i = 0; i < this.records.length; i++) {
          let a = this.records[i];
          for (let j = 0; j < res.length; j++) {
            let b = res[j];
            if (a.lac === b.lac && a.ci === b.ci) {
              a.lat = b.lat;
              a.lng = b.lng;
              a.addr = b.addr;
              a.acc = b.acc;
              continue;
            }
          }
        }
        let tableData = this.mapToArray(this.records)
        this.insertTableData(this.tableName, tableData);
      },
      error => { this.createTableFail('', error) }
    )
  }

  private createSelectLbsLocationSql(lbsMap) {
    let sql = "";
    let mnc = this.yysType.value;
    //map 不能使用forin
    lbsMap.forEach((value, key) => {
      let arr = key.split("--")
      let lac = arr[0];
      let ci = arr[1];
      if (lac && ci) {
        sql += `select mnc,lac,ci,bdlat lat,bdlng lng,addr,acc from henan where lac = '${lac}' and ci = '${ci}' and mnc = ${mnc} union `;
      }
    })

    sql = sql.substr(0, sql.length - 6);
    // console.log(sql)
    return sql;
  }

  private createTableFail(tx, err) {
    EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
    this.removeTable(this.tableName);
    toastr.error('话单导入失败');
    throw new Error(err.message);
  }

  //判断表中是否包含位置信息
  private isHasLocationData(records) {
    let len = records.length;
    if (len > 100) len = 100;
    for (let i = 1; i < len; i++) {
      if (records[i].lat > 0 && records[i].lng > 0)
        return true;
    }
    return false;
  }

  private wgsToBd(records) {
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      let lng = record.lng;
      console.log(lng);
      if (record.lng == 0 || record.lat == 0)
        continue;
      //+号将字符串类型转换未number

      let arr = gcoord.transform(
        [+record.lng, +record.lat],
        gcoord.WGS84,               // 当前坐标系
        gcoord.BD09
      );
      record.lng = arr[0];
      record.lat = arr[1];

      console.log(`transform ${lng} to ${arr[0]}`)
    }
  }


  private isHasLbsData(records) {
    let len = records.length;
    if (len > 100) len = 100;
    for (let i = 1; i < len; i++) {
      if (records[i].lac > 0 && records[i].ci > 0)
        return true;
    }
    return false;
  }

  //////////////////////////////以上是插入话单的步骤//////////////////////////////////////////////
  ///////////////////////////////下面是切换话单列表的逻辑/////////////////////////////////////
  //点击话单列表时
  onClickItem(item) {
    //如果在帮助页面，切换到地图页面
    if (this.url == '/help') {
      this.router.navigateByUrl('/')
    }
    //如果点击的是当前表，不做反应
    if (!item || item == CommonData.currentTable) {
      return;
    }
    //禁用菜单，直到得到数据
    this.isMenuDisable = true;
    //记录当前操作的话单和运营商
    CommonData.currentTable = item;
    let yysMap = { '移动': 0, '联通': 1, '电信': 11 }
    let yys = item.split('_')[0];
    CommonData.CURRENT_MNC = yysMap[yys];

    this.dbService.getRecords(item)
      .done(res => {
        this.setAllRecords(res);
        console.log('ok');
        //获取数据后启用菜单
        this.isMenuDisable = false;
      })
      .fail((tx, err) => { throw new Error(err.message) });

    //切换话单要1、清楚表格数据2、清楚地图marker，3、关闭表格
    this.dispatchClearEvent();
  }

  private setAllRecords(res) {
    if (res.length > 0) {
      CommonData.allRecords = [];
      CommonData.allRecordsMap = new Map();
      for (let i = 0; i < res.length; i++) {
        const r = res[i];
        CommonData.allRecords.push(r);
        CommonData.allRecordsMap.set(r.id, r);
      }
    }
  }

  private dispatchClearEvent() {
    EventBus.dispatch(EventType.CLEAR_GRID_DATA);
    EventBus.dispatch(EventType.CLEAR_MARKER);
    EventBus.dispatch(EventType.TOGGLE_MIDDLE, 0);
  }

  //删除表
  onRemoveTable(tableName) {
    console.log(tableName);
    alertify.set({
      labels: {
        ok: "确定",
        cancel: "取消"
      }
    });
    alertify.confirm("确定要删除该话单吗？", e => {
      if (e) {
        this.removeTable(tableName);
      }
    });
  }

  private removeTable(tableName) {
    EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
    this.dbService.delTable(tableName)
      .done(
        res => {
          this.getTables();
          this.removeFilters();
          this.dispatchClearEvent();
        }
      )
  }

  /**
   * 清楚过滤器
   */
  private removeFilters() {
    for (let i = 1; i < 6; i++) {
      //localStorage中键的保存方式
      let key = CommonData.currentTable + '_f' + i;;
      localStorage.removeItem(key);
    }
  }

  //显示通话详单
  onShowRecords(tableName) {
    EventBus.dispatch(EventType.SHOW_RECORDS, CommonData.allRecords);
  }

  //获取话单的次数统计
  onCountRecord(tableName) {
    this.dbService.getRecordCountInfo(tableName)
      .done(res => { EventBus.dispatch(EventType.SHOW_RECORD_COUNT, res); })
      .fail((tx, err) => { throw new Error(err.message) })
  }

  //夜间通话记录
  onNightRecord() {
    let nightRecords = [];
    let records = CommonData.allRecords;
    records.forEach(item => {
      const startTime = moment(item[Field.START_TIME]);
      const hour = startTime.get('hour');
      if (hour <= 5 || hour >= 22) {
        nightRecords.push(item)
      }
    })
    if (nightRecords.length > 0)
      EventBus.dispatch(EventType.SHOW_RECORDS, nightRecords);
    else
      toastr.error('没有夜间通话记录,请检查起始时间');
  }

  //基站前十名
  onTopTenStations(tableName) {
    this.dbService.getTopTenStations(tableName)
      .done(res => {
        let stations = Record.toStations(res);
        EventBus.dispatch(EventType.SHOW_STATIONS, stations);
        EventBus.dispatch(EventType.SHOW_RECORDS, res);
      })
      .fail((tx, err) => { throw new Error(err.message) });
  }

  //重新加载数据库
  private onRefreshTable(e) {
    this.dbService.getRecords(CommonData.currentTable)
      .done(res => {
        CommonData.allRecords = res;
        // EventBus.dispatch(EventType.SHOW_RECORDS, Model.ALL_RECORDS);
      })
  }

  onMoveRecords() {
    console.log('move record')
    let records = CommonData.allRecords;
    records.sort((a, b) => {
      return a.startTime - b.startTime
    })
    let prevRecord;
    let arr = []
    let groupIndex = 0;
    records.forEach(item => {
      if (prevRecord) {
        let duration = (moment(prevRecord.startTime).diff(moment(item.startTime))) / 1000 / 60;
        if (duration < 10 && prevRecord.lac != '' && item.lac != '' &&
          (prevRecord.lac != item.lac || prevRecord.ci != item.ci)) {
          if (arr.indexOf(prevRecord) == -1) {
            arr.push(prevRecord);
            groupIndex++;
            prevRecord.groupIndex = groupIndex;
          }
          item.groupIndex = groupIndex;
          arr.push(item)
        }
      }
      prevRecord = item;
    })
    console.log(arr);
    EventBus.dispatch(EventType.SHOW_RECORDS, arr);
  }

  //获取多话单共同联系人
  onGetCommonContacts() {
    CommonData.allRecords = null;
    CommonData.currentTable = null;
    this.dispatchClearEvent()

    //关闭打开的话单
    this.accordion.multi = true;
    this.accordion.closeAll();
    this.accordion.multi = false;

    EventBus.dispatch(EventType.SHOW_COMMON_CONTACTS_UI);
  }

  showNumberDialog() {
    this.dialog.open(NumberComponent, { disableClose: true });
  }

}
