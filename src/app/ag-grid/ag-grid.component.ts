import { Component, ViewChild } from '@angular/core';

import { CellEvent, CellValueChangedEvent, ColumnApi, GridApi, RowNode } from 'ag-grid-community';
import * as EventBus from 'eventbusjs';
import * as toastr from 'toastr';
import * as XLSX from 'xlsx';
import { EventType } from '../models/event-type';

import { SqlService } from '../services/sql.service';
import { CommonData } from '../models/commonData';
import { DbService } from './../services/db.service';
import { LocalStorgeService } from './../services/local-storge.service';
import { OtherNumberFilterComponent } from '../other-number-filter/other-number-filter.component';
import { OtherNumberTooltipComponent } from '../other-number-tooltip/other-number-tooltip.component';
import { Station } from '../models/station';
import { Record } from '../models/record';
import { MatDialog } from '@angular/material/dialog';

declare var alertify;
@Component({
  selector: 'app-ag-grid',
  templateUrl: './ag-grid.component.html',
  styleUrls: ['./ag-grid.component.css']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgGridComponent {

  private RECORDS = 1;
  private RECORD_COUNT = 2
  private COMMON_CONTACTS = 3;
  private RECORDS_COMMON_CONTACTS = 4;


  //表格显示状态
  private _state;

  @ViewChild('agGrid') agGrid;

  /**是否显示返回按钮，class绑定*/
  public get isShowBtnBack(): string {
    if (this.historys.length > 1 && this.historyIndex > 0) return 'block'
    return 'none'
  }

  public get isShowBtnForward(): string {
    if (this.historys.length - this.historyIndex > 1) return 'block';
    return 'none'
  }


  /**是否显示显示基站位置按钮，class绑定*/
  isShowBtnLocation

  /**是否显示存储显示内容的按钮 class绑定*/
  isShowBtnSave;

  private columnApi: ColumnApi;
  private gridApi: GridApi;

  //表格数据,rowdata绑定
  gridData;

  //** 单击，双击的判断 */
  private isClick;
  private isPress;
  private isDoubleClick;

  /** 作为编辑后修改相同网格后，防止递归的一种标志 */
  private isEdit;

  private historys: any[] = [];
  private historyIndex = 0;
  private isHistory;

  private currentColDefs;

  /**国际化文本 */
  localeText = {
    // for text filter
    contains: '包含',
    notContains: '不包含',
    startsWith: '开始于',
    endsWith: '结束于',
    filterOoo: '过滤。。。',
    applyFilter: '过滤完成',
    equals: '等于',
    notEqual: '不等于',
    andCondition: '并且',
    orCondition: '或者',
    lessThan:'小于',
    lessThanOrEquals:'小于等于',
    greaterThan:'大于',
    greaterThanOrEquals:'大于等于',
    inRange:'在范围内'
  }

  frameworkComponents= {
    otherNumberFilter: OtherNumberFilterComponent,
    myToolTip: OtherNumberTooltipComponent
  };


  constructor(
    private dbService: DbService,
    private localStorgeService: LocalStorgeService,
    public dialog: MatDialog,
    private sqlService: SqlService) {
    //显示统计表，从menu
    EventBus.addEventListener(EventType.SHOW_RECORD_COUNT, e => { this.showData(e.target, this.RECORD_COUNT) });
    //显示通话记录，从menu,map
    EventBus.addEventListener(EventType.SHOW_RECORDS, e => { this.showData(e.target, this.RECORDS) });
    EventBus.addEventListener(EventType.SHOW_COMMON_CONTACTS, e => { this.showData(e.target, this.COMMON_CONTACTS) });
    EventBus.addEventListener(EventType.CLEAR_GRID_DATA, e => { this.gridData = []; });
    EventBus.addEventListener(EventType.SHOW_STATIONS_RECORDS, e => { this.showData(e.target,this.RECORDS); });
    EventBus.addEventListener(EventType.SHOW_SEARCH_RECORDS, e => { this.showData(e.target, this.RECORDS_COMMON_CONTACTS); });
  }

  //ready 事件监听，主要获取gridapi，和columnapi
  onGridReady(params) {
    console.log('on grid ready')
    this.columnApi = params.columnApi;
    this.gridApi = params.api;
  }

  ////////////////////////////////////////数据显示////////////////////////////////////////////

  public get state() {
    return this._state;
  }
  public set state(value) {
    this._state = value;
    this.isShowBtnSave = this.isShowBtnLocation = (value === this.RECORDS)
    this.getRowStyle(value);
    this.getColDefs(value)
    EventBus.dispatch(EventType.TOGGLE_MIDDLE, this.getGridWidth(value));
  }

  private showData(data, state) {
    this.state = state;
    if (!data || data == this.gridData) {
      this.onClearFilter();
      return;
    }
    this.gridApi.setColumnDefs(this.currentColDefs);
    this.addContactsInfo(data)
    this.gridData = data;
  }

  private setHistoryData(data, state) {
    let historyData = {
      state: state,
      data: data
    }
    this.historys.push(historyData)
  }

  private getGridWidth(state) {
    if (state == this.RECORDS) return 1;
    else if (state == this.COMMON_CONTACTS) return 450;
    else if (state == this.RECORDS_COMMON_CONTACTS) return 650;
    else if (state == this.RECORD_COUNT) return 350;
  }

  /**设置行风格*/
  private getRowStyle(state) {
    if (state == this.RECORD_COUNT) {
      this.agGrid.gridOptions.getRowStyle = (params) => {
        return { background: null, color: null }
      };
    } else {
      this.agGrid.gridOptions.getRowStyle = (params) => {
        if (params.data[Field.TABLE_NAME]) {
          let color, opacity = 1;
          const tables = CommonData.tables;
          if (params.data.lat == 0 || params.data.lng == 0) {
            opacity = 0.5
          }
          for (let i = 0; i < tables.length; i++) {
            if (params.data[Field.TABLE_NAME] == tables[i].name) {
              if (i % 4 == 0) color = 'white';
              else if (i % 4 == 1) color = 'lightblue';
              else if (i % 4 == 2) color = 'lightgreen';
              else color = 'lightskyblue';

              return { backgroundColor: color, opacity: opacity };
            }
          }
        }
        else if (params.data.lat == 0 || params.data.lng == 0) {
          return { fontStyle: 'italic', opacity: 0.6 }
        }
      }
    }
  }

  /**根据状态获取列定义 */
  private getColDefs(state) {
    let colDefs: any[] = [];
    let col_otherNumber = {
      headerName: Field.OTHER_NUMBER_CN,
      field: Field.OTHER_NUMBER,
      colId: Field.OTHER_NUMBER,
      editable: true,
      tooltipField: Field.OTHER_NUMBER,//信息提示字段
      tooltipComponent: "myToolTip",
      filter: "otherNumberFilter",
      sortable:true,
      resizable: true,
      //获取或设置值
      valueGetter: (params) => {
        return params.data.contact ? params.data.contact.name : params.data[Field.OTHER_NUMBER]
      },
      //当修改值的时候，再valueSetter中要设置。修改号码的联系人信息，会反应到这里。
      valueSetter: (params) => {
        params.data.contact = { name: params.newValue, number: params.data[Field.OTHER_NUMBER], insertTime: moment().format("YYYY-MM-DD") };
      },
    }
    const col_startTime = { headerName: Field.START_TIME_CN, field: Field.START_TIME, colId: Field.START_TIME,sortable:true,filter:true,resizable: true };
    const col_callType = { headerName: Field.CALL_TYPE_CN, field: Field.CALL_TYPE, colId: Field.CALL_TYPE,sortable:true,filter:true,resizable: true };
    const col_duration = { headerName: Field.DURATION_CN, field: Field.DURATION, colId: Field.DURATION,sortable:true,filter:'agNumberColumnFilter',resizable: true};
    const col_lac = { headerName: Field.LAC_CN, field: Field.LAC, colId: Field.LAC,sortable:true,filter:true,resizable: true };
    const col_ci = { headerName: Field.CI_CN, field: Field.CI, colId: Field.CI,sortable:true,filter:true,resizable: true }
    const col_countCall = { headerName: Field.COUNT_CALL, field: Field.COUNT_CALL, colId: Field.COUNT_CALL,sortable:true,filter:'agNumberColumnFilter',resizable: true };
    const col_totalTime = { headerName: Field.TOTAL_TIME, field: Field.TOTAL_TIME, colId: Field.TOTAL_TIME,sortable:true,resizable: true }
    const col_tableName = { headerName: Field.TABLE_NAME, field: Field.TABLE_NAME, colId: Field.TABLE_NAME,sortable:true,resizable: true };
    const col_countTable = { headerName: Field.COUNT_TABLE, field: Field.COUNT_TABLE, colId: Field.COUNT_TABLE,sortable:true,resizable: true }
    colDefs.push(col_otherNumber);
    let cols;

    if (state == this.RECORDS) {
      cols = [col_startTime, col_callType, col_duration, col_lac, col_ci]
    } else if (state == this.RECORD_COUNT) {
      cols = [col_countCall, col_totalTime]
    } else if (state == this.COMMON_CONTACTS) {
      cols = [col_tableName]
    } else if (state == this.RECORDS_COMMON_CONTACTS) {
      cols = [col_startTime, col_callType, col_duration, col_tableName]
    }

    this.currentColDefs = colDefs.concat(cols);;
  }

  /** 增加联系人信息*/
  private addContactsInfo(data:any[]) {
    data.forEach(item=>{
      item[Field.CONTACT] = CommonData.ContactsMap.get(item[Field.OTHER_NUMBER])
    })
  }

  /**当行数据改变时会触发，此时要将数据加入历史数据队列， */
  onRowDataChange(e) {
    console.log('on row data change');
    if (!this.state || !this.displayData || this.displayData.length == 0) return;
    if (!this.isHistory) {
      // console.log('data befroe:', this.historys.length, this.historyIndex);
      //数据改变时，删除指针后面的数据，加入当前表数据，重新设置指针到数组结尾
      this.historys.splice(this.historyIndex + 1);
      this.setHistoryData(this.displayData, this.state);
      this.historyIndex = this.historys.length - 1;
      // console.log('data after:', this.historys.length, this.historyIndex)
      // console.log(this.historys)
    }
    if (this.gridData.length > 0) {
      this.autoSizeAll();
    }
    this.isHistory = false;
  }

  //自动设置列宽度
  private autoSizeAll() {
    let allColumnIds = [];
    this.columnApi.getAllColumns().forEach(function (column) {
      allColumnIds.push(column.getColId());
    });
    this.columnApi.autoSizeColumns(allColumnIds);
  }

  onDataChange(e) {
    console.log("change....");
    this.agGrid.gridOptions.api.redrawRows()
  }

  //外部过滤器回调
  //注意，外部过滤器使用的两个参数，在类外面定义
  isExternalFilterPresent() {
    return isFilter;
  }

  doesExternalFilterPass(node: RowNode) {
    if (filterData) isFilter = false;
    if (filterData.field == Field.OTHER_NUMBER) {
      return node.data[Field.OTHER_NUMBER] === filterData.value
    } else if (filterData.field == Field.START_TIME) {
      const startTime = moment(filterData.value);
      return moment(node.data[Field.START_TIME]).dayOfYear() === startTime.dayOfYear()
    }
  }

  ////////////////////////////////////////表格事件/////////////////////////////////////////

  onCellMouseDown(e: CellEvent) {
    this.isClick = false;
    this.isPress = false;
    this.isDoubleClick = false;
    setTimeout(() => {
      if (!this.isClick && !this.isDoubleClick) {
        this.isPress = true;
        console.log('press');
        this.onLongPress(e)
        console.log(e)
      }
    }, 1000);
  }

  private onLongPress(e: CellEvent) {
    const field = e.colDef.field;
    if (field === Field.OTHER_NUMBER || field === Field.START_TIME) {
      isFilter = true;
      filterData = { field: field, value: e.data[field] };
      this.gridApi.onFilterChanged();
    } else {
      isFilter = false;
    }
  }

  //click
  onClick(e: CellEvent) {
    this.isClick = true;
    let headerName = e.colDef.headerName;
    //发送事件，禁止中间容器缩放
    if (headerName == Field.OTHER_NUMBER_CN || headerName == Field.CI_CN || headerName == Field.LAC_CN) {
      EventBus.dispatch(EventType.IS_CAN_TOGGLE_MIDDLE, false);
    }

    setTimeout(() => {
      if (this.isClick && !this.isPress) {
        console.log('click')
        if (headerName == Field.OTHER_NUMBER_CN || headerName == Field.CI_CN || headerName == Field.LAC_CN) {
          EventBus.dispatch(EventType.IS_CAN_TOGGLE_MIDDLE, true);
        }
        //单击单元格逻辑
        this.onClickCell(e);
      }
    }, 500);
  }

  //单击表中内容，显示基站位置或显示号码通话记录
  private onClickCell(e: CellEvent) {
    // EventBus.dispatch(EventType.IS_TOGGLE_MIDDLE, true);
    if (this.isEdit) {
      return;
    }
    //通话记录表，单击显示基站位置
    if (this.state == this.RECORDS || this.state == this.RECORDS_COMMON_CONTACTS) {
      const rowData = e.data;
      if (rowData.lng == 0 || rowData.lat == 0) {
        toastr.info('该基站在数据库没有找到位置信息')
      } else {
        let station = Station.toStation(rowData);
        this.setStationRecords(station);
        EventBus.dispatch(EventType.TOGGLE_LEFT, false);
        EventBus.dispatch(EventType.SHOW_STATIONS, [station]);
      }
    }
    //统计表，单击后显示号码通话详情
    else if (this.state == this.RECORD_COUNT) {
      console.log("显示该号码");
      const rowData = e.data;
      const num = rowData[Field.OTHER_NUMBER];
      this.showData(this.getRecordsByNumber(num), this.RECORDS);
    }
    else if (this.state == this.COMMON_CONTACTS) {
      let otherNumber = e.data[Field.OTHER_NUMBER];
      let tables = e.data[Field.TABLE_NAME].split(' | ')
      this.dbService.getRecordsByNumberAndTable(otherNumber, tables)
        .done(res => {
          this.showData(res, this.RECORDS_COMMON_CONTACTS)
        })
    }
  }

  //获取表格内相同的基站位置，并保存其id
  private setStationRecords(station: Station) {
    let countRecord = this.gridApi.getDisplayedRowCount();
    for (let i = 0; i < countRecord; i++) {
      let element = this.gridApi.getDisplayedRowAtIndex(i).data;
      let s = Station.toStation(element)
      if (station.isSame(s)) {
        station.records.push(element);
      }
    }
  }

  //双击时
  onDoubleClick(e: CellEvent) {
    //避免双击造成触发单击事件
    this.isClick = false;
    this.isDoubleClick = true;
    const headerName = e.colDef.headerName;
    if (headerName === Field.LAC_CN || headerName == Field.CI_CN) {
      console.log('双击了位置列');
      const data = e.data;
      let isHasLocation = (data.lat > 0 && data.lng > 0) ? true : false;
      if (isHasLocation) {
        toastr.info('该基站已经有位置信息了');
        return
      }
      const alertInfo = "如果要添加该基站的位置，请点击确定后，然后在地图上点击基站的位置，否则请点击取消"
      alertify.set({
        labels: { ok: "确定", cancel: "取消" }
      });
      alertify.confirm(alertInfo, isOk => {
        if (isOk) {
          toastr.options.timeOut = 0;
          toastr.info("请在地图上点击选择该基站位置。。。");
          //最大化地图
          EventBus.dispatch(EventType.TOGGLE_LEFT, false);
          EventBus.dispatch(EventType.TOGGLE_MIDDLE, 0);
          //通知地图监听拾取位置点
          EventBus.dispatch(EventType.SET_LBS_LOCATION, { lac: data.lac, ci: data.ci, isHasLocation: isHasLocation, gridData: this.gridData });
          //更改地图光标
          EventBus.dispatch(EventType.SET_CURSOR, CursorType.CROSSHAIR)
        }
      });
    }
    //当双击对端号码时，关闭页面的缩放
    else if (headerName == Field.OTHER_NUMBER_CN) {
      console.log('双击了对端号码列');
      //是否手动修改的标志
      this.isEdit = true;
      EventBus.dispatch(EventType.IS_CAN_TOGGLE_MIDDLE, true);
    }
    console.log('db click')
  }
  //当修改单元格内容后
  onCellValueChange(e: CellValueChangedEvent) {
    //设置手动修改标志，避免因刷新数据造成递归
    if (!this.isEdit)
      return;
    console.log('cell value change');
    const otherNumber = e.data[Field.OTHER_NUMBER];
    if (otherNumber == '') {
      toastr.warning('请勿修改空白号码');
      e.node.setDataValue(Field.OTHER_NUMBER, e.oldValue);
      this.isEdit = false;
      return;
    }
    this.sqlService.insertOrUpdateContects(e.data[Field.OTHER_NUMBER], e.newValue)
      .subscribe(
        res => {
          if (res) {
            this.isEdit = false;
            console.log("edit ok")
            CommonData.ContactsMap.set(e.data[Field.OTHER_NUMBER],e.newValue);
            this.showData(this.gridData, this.state);

            this.gridApi.forEachNode(rowNode => {
              if (rowNode.data[Field.OTHER_NUMBER] == otherNumber) {
                rowNode.setDataValue(Field.OTHER_NUMBER, e.newValue);
              }
            })
          } else {
            toastr.warning('修改失败，请将对端号码转为文本格式后重新导入');
          }
        }
      )
  }

  /** 单击按钮显示表中的基站位置*/
  onShowLocations(e) {
    //显示忙碌图标
    EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, true);
    //如果不setTimeout,会造成show busy icon 没空执行，cup估计被后面的占用了，没有效果。
    setTimeout(() => {
      let stations = this.getRecordsStations();
      if (stations.length > 0) {
        EventBus.dispatch(EventType.SHOW_STATIONS, stations);
      } else {
        toastr.info('话单中没有位置信息');
        EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
      }
    }, 300);
  }

  /**获取当前表的基站信息 */
  private getRecordsStations() {
    //获取当前表格中行数
    let len = this.gridApi.getDisplayedRowCount();
    let records: Array<Record> = [];

    //获取基站的唯一值
    for (let i = 0; i < len; i++) {
      let row = this.gridApi.getDisplayedRowAtIndex(i).data;
      records.push(Record.rowToRecord(row))
    }
    return Record.toStations(records);
  }

  private getRecordsByNumber(otherNumber) {
    let records = CommonData.allRecords;
    let res: any[] = [];
    records.forEach(element => {
      if (element[Field.OTHER_NUMBER] == otherNumber) {
        res.push(element);
      }
    });
    return res;
  }

  onClickBtnSave(index) {
    this.isClick = true;
    EventBus.dispatch(EventType.IS_CAN_TOGGLE_MIDDLE, false);
    setTimeout(() => {
      if (this.isClick) {
        EventBus.dispatch(EventType.IS_CAN_TOGGLE_MIDDLE, true);
        //根据索引判断是否有存储，如果有，使用存储的，没有则设置
        let key = this.getSaveKey(index);
        let data = this.localStorgeService.getObject(key);
        if (data) {
          this.gridData = data;
        } else {
          this.localStorgeService.setObject(key, this.displayData);
        }
      }
    }, 500);
  }

  /**根据索引获取存储的键 */
  private getSaveKey(index) {
    return CommonData.currentTable + '_f' + index;
  }

  //双击按钮清除存储数据
  onDoubleClickBtnSave(index) {
    this.isClick = false;
    //删除存储的过滤器
    let key = this.getSaveKey(index);
    localStorage.removeItem(key)//删除磁盘保存的

    setTimeout(() => {
      EventBus.dispatch(EventType.IS_CAN_TOGGLE_MIDDLE, true);
    }, 500);
    console.log('db click');
  }

  private get displayData() {
    let arr = [];
    let count = this.gridApi.getDisplayedRowCount();
    for (let i = 0; i < count; i++) {
      arr.push(this.gridApi.getDisplayedRowAtIndex(i).data)
    }
    return arr;
  }

  //清除表格过滤
  onClearFilter() {
    isFilter = false;
    this.gridApi.setFilterModel(null);
    this.gridApi.onFilterChanged();
  }

  //获取过滤按钮的图标
  getBtnSaveIconUrl(index) {
    let key = this.getSaveKey(index);
    let data = this.localStorgeService.get(key);
    if (!data) {
      return `url(assets/f${index}_false.png)`;
    }
    return `url(assets/f${index}.png)`;
  }

  onClickBack() {
    this.isHistory = true;
    let data = this.historys[this.historyIndex - 1];
    if (this.historyIndex > 0) this.historyIndex--;
    this.showData(data.data, data.state)
    console.log(this.historys.length, this.historyIndex)
  }

  onClickForward() {
    this.isHistory = true;
    let data = this.historys[this.historyIndex + 1];
    if (this.historyIndex < this.historys.length - 1) this.historyIndex++;
    this.showData(data.data, data.state)
    console.log(this.historys.length, this.historyIndex)
  }

  onClickExcel() {
    let count = this.gridApi.getDisplayedRowCount();
    let data = [];
    for (var i = 0; i < count; i++) {
      var rowNode = this.gridApi.getDisplayedRowAtIndex(i);
      data.push(rowNode.data);
    }
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    let fileName = CommonData.currentTable ? CommonData.currentTable : "共同联系人"
    XLSX.writeFile(wb, fileName + ".xlsx");
  }
}

import * as moment from 'moment'
import { Field } from '../models/field';
import { CursorType } from '../models/cursor-type';
let isFilter, filterData;
