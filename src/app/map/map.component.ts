import { Model } from './../models/Model';
import { SqlService } from './../services/sql.service';
import { Component, OnInit, Input } from '@angular/core';
import * as EventBus from 'eventbusjs';
import * as toastr from 'toastr';
import { EventType } from '../models/event-type';
import { DbService } from '../services/db.service';
import { Station } from '../models/station';
import { MatDialog } from '@angular/material/dialog';
import { AddLbsLocationComponent } from '../add-lbs-location/add-lbs-location.component';
import { Record } from '../models/record';

declare var BMap;
declare var BMapLib;
declare var BMAP_DRAWING_CIRCLE;
declare var BMAP_DRAWING_POLYGON;
declare var BMAP_DRAWING_RECTANGLE;
declare var BMAP_STATUS_SUCCESS;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {


  //百度地图
  private bdmap;

  private drawingManager;

  //地图上点的集合，用来显示返回最佳地图视图
  private mapPoints: Array<any>;

  //marker的zIndex;
  private zIndex: number = 0;

  private focusIndex = 1000000;

  private isMultiple;
  private countStation;

  private prevMark;

  private overlayIndex = 0;

  isSetLbsLocation;

  private _data: Array<Station>;

  private _lbsInfo;

  constructor(private sqlService: SqlService,
    private dbServices: DbService,
    public dialog: MatDialog
  ) {
    this.mapPoints = [];
    EventBus.addEventListener(EventType.SET_CURSOR, e => { this.bdmap.setDefaultCursor(e.target) })
    EventBus.addEventListener(EventType.SHOW_STATIONS, e => { this.data = e.target });
    EventBus.addEventListener(EventType.CLEAR_MARKER, e => { this.clearMark() });
    EventBus.addEventListener(EventType.SET_LBS_LOCATION, e => { this.lbsInfo = e.target })
  }

  ngOnInit() {
    this.initMap();
    this.initdrawingManager();
  }

  public set data(value) {
    if (value && value != this._data) {
      this._data = value;
      if (this.isMultiple) {
        this.clearMark();
      }
      this.isMultiple = value.length > 1;
      EventBus.dispatch(EventType.OPEN_RIGHT);

    }
    console.time("addover")
    setTimeout(() => {
      value.forEach(station => {
        const m = this.createMark(station, false);
        this.addMarkerToMap(m)
      })
    }, 100);
  }

  public get data() {
    return this._data;
  }

  public get lbsInfo() {
    return this._lbsInfo;
  }
  public set lbsInfo(value) {
    this.isSetLbsLocation = true;
    this._lbsInfo = value;
  }

  // 初始化地图
  private initMap() {
    this.bdmap = new BMap.Map("map", { enableMapClick: false });//禁止地图图标点击
    this.bdmap.centerAndZoom('洛阳', 11);
    this.bdmap.enableScrollWheelZoom(true);
    this.bdmap.disableDoubleClickZoom(false);
    this.bdmap.addEventListener('addoverlay', e => { this.onAddOverlay(); })
    this.bdmap.addEventListener('click', e => { this.onMapClick(e) })
  }

  //初始化绘图工具条
  private initdrawingManager() {
    var styleOptions = {
      strokeColor: "lightBlue",    //边线颜色。
      fillColor: 'lightblue',      //填充颜色。当参数为空时，圆形将没有填充效果。
      strokeWeight: 2,       //边线的宽度，以像素为单位。
      strokeOpacity: 0.8,    //边线透明度，取值范围0 - 1。
      fillOpacity: 0.3,      //填充的透明度，取值范围0 - 1。
      strokeStyle: 'solid' //边线的样式，solid或dashed。
    }

    this.drawingManager = new BMapLib.DrawingManager(this.bdmap, {
      isOpen: false, //是否开启绘制模式
      enableDrawingTool: true, //是否显示工具栏
      drawingToolOptions: {
        // anchor: BMAP_ANCHOR_TOP_LEFT, //位置，默认左上
        // offset: new BMap.Size(5, 5), //偏离值
        scale: 0.6,
        drawingModes: [
          // BMAP_DRAWING_MARKER,
          BMAP_DRAWING_CIRCLE,
          // BMAP_DRAWING_POLYLINE,
          BMAP_DRAWING_POLYGON,
          BMAP_DRAWING_RECTANGLE
        ]
      },
      circleOptions: styleOptions, //圆的样式
      polygonOptions: styleOptions, //多边形的样式
      rectangleOptions: styleOptions //矩形的样式
    });

    this.drawingManager._drawingTool.hide();

    this.drawingManager.addEventListener('overlaycomplete', e => { this.showStationAndRecordsInBounds(e) })
  }

  ngAfterViewInit(): void {
    let mapDiv = document.getElementById('map');
    (<any>window).addResizeListener(mapDiv, e => {
      this.onResized({ newWidth: mapDiv.clientWidth })
      // console.log(mapDiv.clientWidth+'--'+mapDiv.clientHeight);
    });
    this.getCurrentLocation();
  }

  //定位
  private getCurrentLocation() {
    // let geolocation = new BMap.Geolocation();
    // geolocation.getCurrentPosition((r) => {
    //   if (geolocation.getStatus() == BMAP_STATUS_SUCCESS) {
    //     this.bdmap.centerAndZoom(r.point, 13)
    //   }
    //   else {
    //     this.bdmap.centerAndZoom('洛阳', 11);
    //   }
    // });

    // var myCity = new BMap.LocalCity();
    // myCity.get((r)=>{
    //   var cityName = r.name;
    //   this.bdmap.setCenter(cityName,13);
    // }); 
  }

  private onAddOverlay() {
    if (!this.isMultiple)
      return;
    this.overlayIndex++;
    if (this.overlayIndex == this.data.length) {
      EventBus.dispatch(EventType.IS_SHOW_BUSY_ICON, false);
      console.timeEnd("addover")
      this.setMapCenter(this.mapPoints);
      this.bdmap.removeEventListener('addoverlay', this.onAddOverlay);
      this.overlayIndex = 0;
    }
  }

  //获得绘制图形的地图范围
  private showStationAndRecordsInBounds(e) {
    if (!Model.currentTable) {
      toastr.warning("请先选择话单才能操作")
    }
    this.bdmap.removeOverlay(e.overlay);
    this.drawingManager.close();//关闭地图绘制状态

    let bounds = e.overlay.getBounds();

    let records = [];
    //如果有基站，过滤当前基站的通话记录
    if (this.hasOverlayInBounds(bounds)) {
      let stations = this.getStationInBounds(bounds);
      for (let i = 0; i < stations.length; i++) {
        const s = stations[i];
        records = records.concat(s.records)
      }
    }
    //如果没有基站，查找话单内所有当前位置基站
    else {
      console.log('范围内没有显示的基站');
      let allRecords = Model.allRecords;
      allRecords.forEach(record => {
        let p = new BMap.Point(record.lng, record.lat)
        if (bounds.containsPoint(p)) {
          records.push(record);
        }
      });
    }
    if(records.length == 0){
      toastr.info('该话单在所选范围内没有基站。。');
      return
    }
    this.data = Record.toStations(records)
    EventBus.dispatch(EventType.TOGGLE_MIDDLE, true)
    EventBus.dispatch(EventType.SHOW_STATIONS_RECORDS, records);
  }

  //检测绘制范围内是否有覆盖物
  private hasOverlayInBounds(bounds) {
    let overlays = this.bdmap.getOverlays();
    for (let i = 0; i < overlays.length; i++) {
      let o = overlays[i];
      if (bounds.containsPoint(o.getPosition()))
        return true;
    }
    return false;
  }
  //获取绘制范围内的基站
  private getStationInBounds(bounds) {
    let arr = [];
    this.data.forEach(s => {
      let p = new BMap.Point(s.lng, s.lat);
      if (bounds.containsPoint(p))
        arr.push(s);
    })
    return arr;
  }

  //添加mark到地图内
  private addMarkerToMap(marker) {
    //添加marker图标变化
    if (this.prevMark) {
      this.clearFocusMarker(this.prevMark);
    }

    marker.setZIndex(this.zIndex);
    this.mapPoints.push(marker.getPosition());
    this.bdmap.addOverlay(marker);
    this.zIndex++;

    if (!this.isMultiple) {
      this.setMapCenter(this.mapPoints);
    }
    this.prevMark = marker;
  }

  private setMapCenter(mapPoints) {
    let vp = this.bdmap.getViewport(mapPoints);
    this.bdmap.centerAndZoom(vp.center, vp.zoom);
  }

  //设置marker鼠标监听
  private setMarkListener(marker) {
    //单击双击的判断,然后添加事件监听
    let isClick = true;
    marker.addEventListener('click', ($event) => {
      isClick = true;
      setTimeout(() => {
        if (isClick) {
          this.onMarkerClick($event);
        }
      }, 500);
    })
    marker.addEventListener('dblclick', ($event) => {
      isClick = false;
      this.onMarkerDoubleClick($event);
    })

    marker.addEventListener('mouseover', ($event) => { this.onMarkerOver($event) });
    marker.addEventListener('mouseout', ($event) => { this.onMarkerOut($event) });
  }

  /**创建mark，station：数据，isfocus：是否焦点图标 */
  private createMark(station: Station, isFocus: boolean) {
    let marker;
    let point = new BMap.Point(station.lng, station.lat);
    marker = new BMap.Marker(point);
    //创建icon
    let icon = this.createIcon(station, isFocus);
    marker.setIcon(icon);

    let label = this.createLabel(station, isFocus);
    marker.setLabel(label);

    //把station附加给marker
    marker.attributes = station;
    this.setMarkListener(marker);
    return marker;
  }

  private createIcon(station: Station, isFocus) {
    let url = "assets/location_lightblue.png";
    let count = station.records.length;
    if (isFocus) {
      url = "assets/location_focus.png"
    } else if (count > 50) {
      url = "assets/location_red.png"
    } else if (count > 30) {
      url = "assets/location_orange.png"
    } else if (count > 10) {
      url = "assets/location_blue.png"
    } else if (count > 5) {
      url = "assets/location_green.png"
    }
    let icon = new BMap.Icon(
      url,
      new BMap.Size(28, 50),
      {
        anchor: new BMap.Size(13, 50)
      }
    )
    return icon;
  }

  private createLabel(station: Station, isFocus) {
    let dx = 3, dy = 2, fz = 16;
    let count = station.records.length;
    let color = isFocus ? 'yellow' : 'dimgray';
    if (count < 10) {
      dx = 7;
    } else if (count < 1000 && count >= 100) {
      fz = 12; dy = 5; dx = 2;
    } else if (count >= 1000 && count < 10000) {
      dx = -1; dy = 6; fz = 8;
      if (!isFocus) color = 'black';
    }
    let label = new BMap.Label(count, { offset: new BMap.Size(dx, dy) });
    label.setStyle({
      border: 'none',
      background: 'none',
      color: color,
      fontSize: fz + 'px',
      fontFamily: '微软雅黑'
    })
    return label;
  }

  //基站图标单击
  private onMarkerClick(e) {
    let attr: Station = e.target.attributes;
    toastr.info(`lat:${attr.lac}---ci:${attr.ci}</br>位置：${attr.addr}</br>覆盖半径:${attr.acc}米`);
    let p = new BMap.Point(attr.lng, attr.lat);
    this.setCircle(p, attr.acc);
  }

  private setCircle(point, radius) {
    let options = { strokeColor: '#346C95', fillColor: '#8BC6F0', strokeWeight: 1, strokeOpacity: 0.8, fillOpacity: 0.4 };
    let circle = new BMap.Circle(point, radius, options);
    this.bdmap.addOverlay(circle);
    circle.addEventListener('click', e => { this.bdmap.removeOverlay(circle) })
  }

  /**基站图标双击，显示基站对应的通话记录 */
  private onMarkerDoubleClick(e) {
    let station: Station = e.target.attributes;
    EventBus.dispatch(EventType.TOGGLE_MIDDLE, true)
    EventBus.dispatch(EventType.SHOW_STATIONS_RECORDS, station.records);
  }

  //鼠标overMark
  private onMarkerOver(e) {
    this.setFocusMarker(e.target);
  }

  private onMarkerOut(e) {
    this.clearFocusMarker(e.target);
  }

  //设置焦点marker
  private setFocusMarker(marker) {
    let station = marker.attributes
    marker.setZIndex(this.focusIndex);
    marker.setIcon(this.createIcon(station, true));
    marker.setLabel(this.createLabel(station, true));
    this.focusIndex++;
  }

  //设置失去焦点marker
  private clearFocusMarker(marker) {
    let station = marker.attributes
    marker.setIcon(this.createIcon(station, false));
    marker.setLabel(this.createLabel(station, false));
  }

  //根据基站编号获取位置
  // private getStationLocation(station: Station) {
  //   this.sqlService.getLbsLocation(station.lac, station.ci, station.mnc)
  //     .subscribe(
  //       res => {
  //         const obj = res[0];
  //         if (obj) {
  //           // station其他值赋值
  //           station.lat = obj.bdlat;
  //           station.lng = obj.bdlng;
  //           station.addr = obj.addr;
  //           this.showLocation(station);
  //         } else {
  //           toastr.info("没有找到基站位置");
  //         }
  //       }
  //     )
  // }

  //清楚全部mark
  clearMark() {
    // console.log('clear mark')
    if (this.bdmap) {
      this.bdmap.clearOverlays();
      this.mapPoints = [];
      this.prevMark = null;
    }
  }

  //地图空白区域单击，隐藏上下两个工具
  onMapClick(e) {
    let mouseEvent: MouseEvent = e;
    // console.log(e.point)
    if (this.isSetLbsLocation) {
      //设置是否为添加lbs位置的模式
      this.isSetLbsLocation = false;
      console.log(this.lbsInfo.lac, this.lbsInfo.ci);
      toastr.clear();
      toastr.options.timeOut = 3000;
      EventBus.dispatch(EventType.SET_CURSOR, Model.CURSOR_AUTO);
      const data = {
        lac: this.lbsInfo.lac,
        ci: this.lbsInfo.ci,
        isHasLocation: this.lbsInfo.isHasLocation,
        gridData: this.lbsInfo.gridData,
        lat: e.point.lat.toFixed(8),
        lng: e.point.lng.toFixed(8),
      }
      this.dialog.open(AddLbsLocationComponent, { data: data, disableClose: true })
    }

    if ((mouseEvent.clientX > Model.width / 2 - 50 || mouseEvent.clientX < Model.width / 2 - 50) && mouseEvent.clientY < 50) {
      this.drawingManager._drawingTool.show();
    } else {
      this.drawingManager._drawingTool.hide();
    }
  }

  //地图尺寸改变时设置工具条位置
  onResized(e) {
    // console.log('map resize')
    let drawToolsWidth = 124;
    let dx = (e.newWidth - drawToolsWidth) / 2;
    // console.log(e.newWidth+'--'+e.newHeight);
    // console.log(Model.width+'--'+Model.height)

    let off = new BMap.Size(dx, 5);
    this.drawingManager._drawingTool.setOffset(off);

    this.setMapCenter(this.mapPoints);
  }

}
