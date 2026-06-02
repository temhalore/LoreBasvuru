import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface HierarchicalTreeConfig {
  // Ana seviye (parent) konfigürasyonu
  parentLevel: {
    displayField: string; // Hangi field gösterilecek (örn: 'pageDto.name' veya 'name')
    keyField: string; // Unique identifier field (örn: 'eid')
    hasCheckbox?: boolean; // Parent seviyede checkbox olsun mu
    cssClass?: string; // Parent için özel CSS class
    icon?: string; // Parent için icon
    colorClass?: string; // Parent için renk class'ı
  };
  
  // Alt seviye (child) konfigürasyonu  
  childLevel: {
    displayField: string; // Hangi field gösterilecek (örn: 'name')
    keyField: string; // Unique identifier field (örn: 'eid')
    hasCheckbox: boolean; // Child seviyede checkbox (genelde true)
    permissionField: string; // Permission durumu field'ı (örn: 'isRoleWidget')
    cssClass?: string; // Child için özel CSS class
    icon?: string; // Child için icon
    colorClass?: string; // Child için renk class'ı
  };

  // Genel ayarlar
  title?: string;
  subtitle?: string;
  emptyStateMessage?: string;
  loadingMessage?: string;
}

export interface HierarchicalTreeNode {
  data: any; // Generic data object
  expanded?: boolean;
  children?: HierarchicalTreeNode[];
}

export interface TreeItemChangeEvent {
  item: any; // Değişen item'ın data'sı
  checked: boolean; // Yeni durum
  parentItem?: any; // Parent item varsa
}

@Component({
  selector: 'app-hierarchical-tree',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './hierarchical-tree.component.html',
  styleUrls: ['./hierarchical-tree.component.scss']
})
export class HierarchicalTreeComponent implements OnInit, OnChanges {
  @Input() data: HierarchicalTreeNode[] = [];
  @Input() config!: HierarchicalTreeConfig;
  @Input() loading: boolean = false;
  
  @Output() itemPermissionChange = new EventEmitter<TreeItemChangeEvent>();
  @Output() parentPermissionChange = new EventEmitter<TreeItemChangeEvent>();

  // Search functionality
  searchTerm: string = '';
  filteredData: HierarchicalTreeNode[] = [];

  ngOnInit(): void {
    this.expandAllNodes();
    this.applyFilter();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.expandAllNodes();
      this.applyFilter();
    }
  }

  private expandAllNodes() {
    this.data.forEach(node => {
      node.expanded = true;
    });
  }

  // Search and filter functionality
  applyFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredData = [...this.data];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredData = this.data.map(parentNode => {
      const parentName = this.getParentDisplayName(parentNode).toLowerCase();
      const matchingChildren = (parentNode.children || []).filter(child => {
        const childName = this.getChildDisplayName(child).toLowerCase();
        return childName.includes(searchLower);
      });

      // Parent matches or has matching children
      if (parentName.includes(searchLower) || matchingChildren.length > 0) {
        return {
          ...parentNode,
          children: parentName.includes(searchLower) ? parentNode.children : matchingChildren,
          expanded: true // Auto-expand when searching
        };
      }
      return null;
    }).filter(Boolean) as HierarchicalTreeNode[];
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  // Parent seviye node'ları döndür (filtered data'dan)
  getParentNodes(): HierarchicalTreeNode[] {
    return this.filteredData.filter(node => 
      node.children && node.children.length > 0
    );
  }

  // Child node'ları döndür
  getChildNodes(parentNode: HierarchicalTreeNode): HierarchicalTreeNode[] {
    return parentNode.children || [];
  }

  // Parent display name'i al
  getParentDisplayName(parentNode: HierarchicalTreeNode): string {
    return this.getNestedProperty(parentNode.data, this.config.parentLevel.displayField) || 'Bilinmeyen';
  }

  // Child display name'i al
  getChildDisplayName(childNode: HierarchicalTreeNode): string {
    return this.getNestedProperty(childNode.data, this.config.childLevel.displayField) || 'Bilinmeyen';
  }

  // Parent key'i al
  getParentKey(parentNode: HierarchicalTreeNode): string {
    return this.getNestedProperty(parentNode.data, this.config.parentLevel.keyField) || '';
  }

  // Child key'i al
  getChildKey(childNode: HierarchicalTreeNode): string {
    return this.getNestedProperty(childNode.data, this.config.childLevel.keyField) || '';
  }

  // Child permission durumunu al
  getChildPermission(childNode: HierarchicalTreeNode): boolean {
    return this.getNestedProperty(childNode.data, this.config.childLevel.permissionField) || false;
  }

  // Child permission durumunu set et
  setChildPermission(childNode: HierarchicalTreeNode, value: boolean): void {
    this.setNestedProperty(childNode.data, this.config.childLevel.permissionField, value);
  }

  // Nested property getter (örn: 'pageDto.name')
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current && current[prop], obj);
  }

  // Nested property setter
  private setNestedProperty(obj: any, path: string, value: any): void {
    const props = path.split('.');
    const last = props.pop()!;
    const target = props.reduce((current, prop) => {
      if (!current[prop]) current[prop] = {};
      return current[prop];
    }, obj);
    target[last] = value;
  }

  // Child checkbox değiştiğinde
  onChildCheckboxChange(childNode: HierarchicalTreeNode, parentNode: HierarchicalTreeNode, checked: boolean): void {
    this.setChildPermission(childNode, checked);
    
    this.itemPermissionChange.emit({
      item: childNode.data,
      checked: checked,
      parentItem: parentNode.data
    });
  }

  // Parent checkbox değiştiğinde (tüm children'ı etkiler)
  onParentCheckboxChange(parentNode: HierarchicalTreeNode, checked: boolean): void {
    const children = this.getChildNodes(parentNode);
    
    children.forEach(child => {
      this.setChildPermission(child, checked);
      
      this.itemPermissionChange.emit({
        item: child.data,
        checked: checked,
        parentItem: parentNode.data
      });
    });

    // Parent değişikliği de emit et
    this.parentPermissionChange.emit({
      item: parentNode.data,
      checked: checked
    });
  }

  // Parent checkbox durumunu hesapla (checked/indeterminate)
  getParentCheckboxState(parentNode: HierarchicalTreeNode): {checked: boolean, indeterminate: boolean} {
    const children = this.getChildNodes(parentNode);
    if (children.length === 0) {
      return {checked: false, indeterminate: false};
    }

    const checkedChildren = children.filter(child => this.getChildPermission(child));
    
    if (checkedChildren.length === 0) {
      return {checked: false, indeterminate: false};
    } else if (checkedChildren.length === children.length) {
      return {checked: true, indeterminate: false};
    } else {
      return {checked: false, indeterminate: true};
    }
  }

  // Node toggle
  toggleNode(node: HierarchicalTreeNode): void {
    node.expanded = !node.expanded;
  }

  // TrackBy functions - Arrow functions olarak tanımla (this context korunur)
  trackByParent = (index: number, parentNode: HierarchicalTreeNode): string => {
    return this.getParentKey(parentNode) || index.toString();
  }

  trackByChild = (index: number, childNode: HierarchicalTreeNode): string => {
    return this.getChildKey(childNode) || index.toString();
  }

  // Helper methods
  hasChildren(node: HierarchicalTreeNode): boolean {
    return node.children && node.children.length > 0;
  }

  getSelectedChildCount(parentNode: HierarchicalTreeNode): string {
    if (!this.hasChildren(parentNode)) return '';
    
    const totalChildren = parentNode.children?.length || 0;
    const selectedCount = parentNode.children?.filter(child => 
      this.getChildPermission(child)
    ).length || 0;
    
    return `(${selectedCount}/${totalChildren})`;
  }
}
