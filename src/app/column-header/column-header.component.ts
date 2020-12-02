import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-column-header',
  templateUrl: './column-header.component.html',
  styleUrls: ['./column-header.component.css']
})
export class ColumnHeaderComponent {

  private params: any;

  private ascSort: string;
  private descSort: string;
  private noSort: string;

  @ViewChild('menuButton', { read: ElementRef }) public menuButton;

  agInit(params): void {
    this.params = params;

    params.column.addEventListener('sortChanged', this.onSortChanged.bind(this));
    this.onSortChanged();
  }

  onMenuClicked() {
    this.params.showColumnMenu(this.menuButton.nativeElement);
  };

  onSortChanged() {
    this.ascSort = this.descSort = this.noSort = 'inactive';
    if (this.params.column.isSortAscending()) {
      this.ascSort = 'active';
    } else if (this.params.column.isSortDescending()) {
      this.descSort = 'active';
    } else {
      this.noSort = 'active';
    }
  }

  onSortRequested(order, event) {
    this.params.setSort(order, event.shiftKey);
  }

}
