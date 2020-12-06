import { CommonContactsComponent } from './common-contacts/common-contacts.component';
import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentFactory } from '@angular/core';
import { TweenMax } from 'gsap';

import * as EventBus from 'eventbusjs'
import { EventType } from './models/event-type';
import { Model } from './models/Model';
import { ResizeEvent } from './models/resize-event';
import { Router, NavigationEnd } from '@angular/router';
import { SqlService } from './services/sql.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  private isLeftOpen = true;
  //中间表格容器是否最大化，最小化，和默认值
  private isMaxMiddle = false;
  private isMinMiddle = true;
  private middleWidth = 500;

  //中间容器是否可以双击改变大小
  private isCanToggleMiddle = true;

  //是否显示忙碌图标
  isShowBusyIcon: boolean;

  private url = '';

  @ViewChild('commonContacts', { read: ViewContainerRef }) container: ViewContainerRef

  constructor(
    private router: Router,
    private resolver: ComponentFactoryResolver,
    private sqlServices: SqlService,
    private http: HttpClient) {
    EventBus.addEventListener(EventType.TOGGLE_MIDDLE, e => { this.resetMiddle(e.target) });
    EventBus.addEventListener(EventType.TOGGLE_LEFT, e => { this.toggleLeft(e.target) });
    EventBus.addEventListener(EventType.OPEN_RIGHT, e => { this.openRight() });
    EventBus.addEventListener(EventType.IS_CAN_TOGGLE_MIDDLE, e => { this.isCanToggleMiddle = e.target; })
    EventBus.addEventListener(EventType.SHOW_COMMON_CONTACTS_UI, e => { this.showCommonContactsUI() })
    EventBus.addEventListener(EventType.IS_SHOW_BUSY_ICON, e => { this.isShowBusyIcon = e.target; console.log("busy icon:" + e.target) })
  }

  ngOnInit(): void {
    this.getContacts();
    this.getFieldsMap();
    Model.width = window.innerWidth;
    Model.height = window.innerHeight;
    window.addEventListener('resize', e => {
      Model.width = (<Window>(e.target)).innerWidth;
    })

    //获取当前url，当点击左侧关闭按钮时使用
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) { // 当导航成功结束时执行
        this.url = e.url;
      }
    })
  }

  //获取服务器端存储的电话号码联系人信息
  private getContacts() {
    Model.ContactsMap = {};
    this.sqlServices.selectContactInfo().subscribe(
      res => {
        res.forEach(item => { Model.ContactsMap[item.number]=item
        })
      }
    )
    console.log(Model.ContactsMap)
  }

  //获取话单可能的字段
  private getFieldsMap() {
    Model.fieldsMap = new Map();
    this.http.get("assets/fields.json").subscribe(
      data => {
        for (const key in data) {
          data[key].forEach(item => { Model.fieldsMap.set(item, key) })
        }
      }
    )
  }

  // 面板开启关闭
  onToggleLeft() {
    if (this.url == '/help') {
      this.router.navigateByUrl('/')
    } else {
      this.toggleLeft(!this.isLeftOpen)
    }
  }

  private toggleLeft(toggle: boolean) {
    toggle ? this.openLeft() : this.closeLeft();
  }

  private openLeft() {
    if (!this.isLeftOpen) {
      TweenMax.to(".leftContainer", 0.5, { width: "280px" });
      TweenMax.to("#toggleLeft", 0.5, { transform: "rotate(0deg)", left: '285px' });
      this.isLeftOpen = true;
    }
  }

  private closeLeft() {
    if (this.isLeftOpen) {
      TweenMax.to(".leftContainer", 0.5, { width: "0px" });
      TweenMax.to("#toggleLeft", 0.5, { transform: "rotate(180deg)", left: '5px' });
      this.isLeftOpen = false;
    }
  }

  //拖动改变表格容器宽度后
  onDragResizeStop(e: ResizeEvent) {
    this.middleWidth = e.size.width
  }

  //双击表格容器
  onDoubleClickMiddle() {
    if (this.isCanToggleMiddle) {
      this.isMaxMiddle ? this.resetMiddle(1) : this.maxMiddle();
    }
  }

  //双击地图容器
  onDoubleClickRight() {
    this.isMinMiddle ? this.resetMiddle(1) : this.minMiddle();
  }

  private maxMiddle() {
    let w = this.isLeftOpen ? Model.width - 280 : Model.width;
    this.setMiddleWidth(w);
    this.isMaxMiddle = true;
    this.isMinMiddle = false;
  }

  private minMiddle() {
    this.setMiddleWidth(0);
    this.isMinMiddle = true;
    this.isMaxMiddle = false;
  }

  //参数传入0：关闭 1：使用this.middleWidth,其他:使用open Width；
  private resetMiddle(openWidth) {
    let w = openWidth == 1 ? this.middleWidth : openWidth;
    this.setMiddleWidth(w);
    this.isMinMiddle = false;
    this.isMaxMiddle = false;
  }

  private setMiddleWidth(width) {
    TweenMax.to('.middleContainer', 0.5, { width: width + 'px' });
  }

  private openRight() {
    if (this.isMaxMiddle) {
      this.resetMiddle(this.middleWidth);
    }
  }

  private showCommonContactsUI() {
    this.container.clear();
    const factory: ComponentFactory<CommonContactsComponent> = this.resolver.resolveComponentFactory(CommonContactsComponent);
    let componentRef = this.container.createComponent(factory);
    componentRef.instance.tables = Model.tables;

    TweenMax.to(".commonContacts", 0.5, { left: "285px" })
  }

}
