import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatRadioModule } from '@angular/material/radio'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatInputModule } from '@angular/material/input'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatListModule } from '@angular/material/list'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'

import { AngularDraggableModule } from 'angular2-draggable';
import { RouterModule, Routes } from '@angular/router';
//输入网址后路由定向
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { MenuComponent } from './menu/menu.component';
import { HelpComponent } from './help/help.component';
import { AgGridComponent } from './ag-grid/ag-grid.component';
import { ColumnHeaderComponent } from './column-header/column-header.component';
import { CommonContactsComponent } from './common-contacts/common-contacts.component';
import { OtherNumberFilterComponent } from './other-number-filter/other-number-filter.component';
import { NumberComponent } from './number/number.component';
import { AddLbsLocationComponent } from './add-lbs-location/add-lbs-location.component';

const appRoutes: Routes = [
  { path: '', component: MapComponent },
  { path: 'help', component: HelpComponent },
]

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    MenuComponent,
    HelpComponent,
    AgGridComponent,
    ColumnHeaderComponent,
    CommonContactsComponent,
    OtherNumberFilterComponent,
    NumberComponent,
    AddLbsLocationComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatRadioModule,
    MatExpansionModule,
    MatInputModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatListModule,
    MatDialogModule,
    FormsModule,
    AngularDraggableModule,
    MatCardModule,
    RouterModule.forRoot(appRoutes),
    AgGridModule.withComponents([ColumnHeaderComponent, OtherNumberFilterComponent]),
  ],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
  bootstrap: [AppComponent],
  entryComponents: [CommonContactsComponent, NumberComponent, AddLbsLocationComponent]
})
export class AppModule { }
