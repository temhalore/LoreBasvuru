// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TreeNode } from 'app/shared/components/tree-list/tree-list.types';

export interface WidgetPermissionChangeEvent {
  pageId: number;
  widgetEid: string;
  widgetName: string;
  isChecked: boolean;
}

@Component({
  selector: 'app-role-widget-tree',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './role-widget-tree.component.html',
  styleUrls: ['./role-widget-tree.component.scss']
})
export class RoleWidgetTreeComponent implements OnInit, OnChanges {
  @Input() data: TreeNode[] = [];
  @Input() loading: boolean = false;
  @Input() title: string = 'Komponent Yetki Yönetimi';
  @Input() subtitle: string = 'Sayfa ve komponent yetkilerini yönetin';
  @Input() selectedWidgets: string[] = []; // EID'ler array'i
  
  @Output() onWidgetPermissionChange = new EventEmitter<{widget: any, checked: boolean}>();
  @Output() widgetPermissionChange = new EventEmitter<WidgetPermissionChangeEvent>();
  @Output() navigateToWidget = new EventEmitter<{ pageId: number; widgetEid: string; widgetName: string }>();

  ngOnInit(): void {
    // Tüm node'ları genişletilmiş olarak başlat
    this.expandAllNodes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.expandAllNodes();
    }
  }

  private expandAllNodes() {
    this.data.forEach(node => {
      node.expanded = true;
    });
  }

  toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
  }

  isWidgetSelected(widgetEid: string): boolean {
    return this.selectedWidgets.includes(widgetEid);
  }

  onWidgetCheckboxChange(widget: TreeNode, isChecked: boolean) {
    if (widget.data.pageId && widget.data.name) {
      this.widgetPermissionChange.emit({
        pageId: widget.data.pageId,
        widgetEid: widget.data.eid,
        widgetName: widget.data.name,
        isChecked: isChecked
      });
    }
  }

  onWidgetClick(widget: TreeNode) {
    if (widget.data.pageId && widget.data.name) {
      this.navigateToWidget.emit({
        pageId: widget.data.pageId,
        widgetEid: widget.data.eid,
        widgetName: widget.data.name
      });
    }
  }

  /**
   * Sayfa node'larını döndürür (children'ı olan top-level node'lar)
   */
  getPageNodes(): TreeNode[] {
    return this.data.filter(node => 
      node.children && node.children.length > 0
    );
  }

  /**
   * Bir sayfa node'unun widget'larını döndürür
   */
  getWidgetNodes(pageNode: TreeNode): TreeNode[] {
    return pageNode.children || [];
  }

  /**
   * Sayfa ismini döndürür
   */
  getPageName(pageNode: TreeNode): string {
    return pageNode.data?.pageDto?.name || pageNode.data?.name || 'Sayfa';
  }

  /**
   * Sayfa router link'ini döndürür
   */
  getPageRouterLink(pageNode: TreeNode): string {
    return pageNode.data?.pageDto?.routerLink || '';
  }

  /**
   * Widget ismini döndürür
   */
  getWidgetName(widgetNode: TreeNode): string {
    return widgetNode.data?.name || 'Widget';
  }

  /**
   * Widget selector'ını döndürür
   */
  getWidgetSelector(widgetNode: TreeNode): string {
    return widgetNode.data?.selector || '';
  }

  /**
   * Widget yetki durumunu döndürür
   */
  isWidgetAuthorized(widgetNode: TreeNode): boolean {
    return widgetNode.data?.isRoleWidget || false;
  }

  /**
   * Widget yetki durumunu değiştirir
   */
  toggleWidgetPermission(widgetNode: TreeNode): void {
    const currentState = this.isWidgetAuthorized(widgetNode);
    const newState = !currentState;
    
    // Local state'i güncelle
    if (widgetNode.data) {
      widgetNode.data.isRoleWidget = newState;
    }

    // Parent component'e bildir
    this.onWidgetPermissionChange.emit({
      widget: widgetNode.data,
      checked: newState
    });

    // Eski event'i de emit et (backward compatibility)
    if (widgetNode.data.pageId && widgetNode.data.name) {
      this.widgetPermissionChange.emit({
        pageId: widgetNode.data.pageId,
        widgetEid: widgetNode.data.eid,
        widgetName: widgetNode.data.name,
        isChecked: newState
      });
    }
  }

  /**
   * Sayfa için tüm widget'ları seç/seçme
   */
  toggleAllWidgetsForPage(pageNode: TreeNode, checked: boolean): void {
    const widgets = this.getWidgetNodes(pageNode);
    
    widgets.forEach(widget => {
      if (widget.data) {
        widget.data.isRoleWidget = checked;
        this.onWidgetPermissionChange.emit({
          widget: widget.data,
          checked: checked
        });

        // Eski event'i de emit et
        if (widget.data.pageId && widget.data.name) {
          this.widgetPermissionChange.emit({
            pageId: widget.data.pageId,
            widgetEid: widget.data.eid,
            widgetName: widget.data.name,
            isChecked: checked
          });
        }
      }
    });
  }

  /**
   * Sayfa için widget yetki durumunu kontrol eder
   */
  getPageCheckboxState(pageNode: TreeNode): {checked: boolean, indeterminate: boolean} {
    const widgets = this.getWidgetNodes(pageNode);
    if (widgets.length === 0) {
      return {checked: false, indeterminate: false};
    }

    const authorizedWidgets = widgets.filter(w => this.isWidgetAuthorized(w));
    
    if (authorizedWidgets.length === 0) {
      return {checked: false, indeterminate: false};
    } else if (authorizedWidgets.length === widgets.length) {
      return {checked: true, indeterminate: false};
    } else {
      return {checked: false, indeterminate: true};
    }
  }

  /**
   * Sayfa checkbox'ı değiştiğinde
   */
  onPageCheckboxChange(pageNode: TreeNode, checked: boolean): void {
    this.toggleAllWidgetsForPage(pageNode, checked);
  }

  /**
   * TrackBy functions for performance
   */
  trackByPageNode(index: number, pageNode: TreeNode): string {
    return pageNode.data?.eid || pageNode.data?.pageDto?.eid || index.toString();
  }

  trackByWidgetNode(index: number, widgetNode: TreeNode): string {
    return widgetNode.data?.eid || index.toString();
  }

  getPageDisplayName(pageData: any): string {
    return pageData.pageDto?.name || pageData.name || 'Bilinmeyen Sayfa';
  }

  hasChildren(node: TreeNode): boolean {
    return node.children && node.children.length > 0;
  }

  getSelectedWidgetCount(node: TreeNode): string {
    if (!this.hasChildren(node)) return '';
    
    const totalWidgets = node.children?.length || 0;
    const selectedCount = node.children?.filter(child => 
      this.isWidgetSelected(child.data.eid)
    ).length || 0;
    
    return `(${selectedCount}/${totalWidgets})`;
  }
}
