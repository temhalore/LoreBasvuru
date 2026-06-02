// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnInit, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-json-node',
    templateUrl: './json-node.component.html',
    styleUrls: ['./json-node.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatMenuModule,
        MatTooltipModule
    ]
})
export class JsonNodeComponent {
    @Input() key: string = '';
    @Input() value: any;
    @Input() parentType: 'object' | 'array' = 'object';
    @Input() index: number = -1;
    @Input() level: number = 0;

    @Output() keyChange = new EventEmitter<string>();
    @Output() valueChange = new EventEmitter<any>();
    @Output() delete = new EventEmitter<void>();

    isExpanded: boolean = true;
    valueType: 'string' | 'number' | 'boolean' | 'object' | 'array' = 'string';
    
    // Local editing variables to prevent re-render on each keystroke
    editingKey: string = '';
    editingValue: any = '';

    types = [
        { value: 'string', label: 'String', icon: 'text_fields' },
        { value: 'number', label: 'Number', icon: '123' },
        { value: 'boolean', label: 'Boolean', icon: 'toggle_on' },
        { value: 'object', label: 'Object', icon: 'data_object' },
        { value: 'array', label: 'Array', icon: 'data_array' }
    ];

    ngOnInit() {
        this.detectType();
        this.editingKey = this.key;
        this.editingValue = this.value;
    }

    ngOnChanges() {
        // Sync editing values when inputs change from parent
        this.editingKey = this.key;
        this.editingValue = this.value;
    }

    detectType() {
        if (Array.isArray(this.value)) {
            this.valueType = 'array';
        } else if (this.value === null) {
            this.valueType = 'string'; // Treat null as empty string or handle separately? Let's default to string for now.
            this.value = '';
        } else if (typeof this.value === 'object') {
            this.valueType = 'object';
        } else if (typeof this.value === 'number') {
            this.valueType = 'number';
        } else if (typeof this.value === 'boolean') {
            this.valueType = 'boolean';
        } else {
            this.valueType = 'string';
        }
    }

    onKeyBlur() {
        if (this.editingKey !== this.key) {
            this.key = this.editingKey;
            this.keyChange.emit(this.editingKey);
        }
    }

    onKeyTab(event: KeyboardEvent) {
        // Prevent default tab behavior
        event.preventDefault();
        
        // First save the key if changed
        if (this.editingKey !== this.key) {
            this.key = this.editingKey;
            this.keyChange.emit(this.editingKey);
        }
        
        // Focus the value input
        setTimeout(() => {
            const container = (event.target as HTMLElement).closest('.json-node-row');
            if (container) {
                const valueInput = container.querySelector('input[placeholder="value"], input[placeholder="0"]') as HTMLInputElement;
                if (valueInput) {
                    valueInput.focus();
                }
            }
        }, 0);
    }

    onValueBlur() {
        if (this.editingValue !== this.value) {
            this.value = this.editingValue;
            this.valueChange.emit(this.editingValue);
        }
    }

    onKeyChange(newKey: string) {
        this.key = newKey;
        this.keyChange.emit(newKey);
    }

    onValueChange(newValue: any) {
        this.value = newValue;
        this.valueChange.emit(newValue);
    }

    onTypeChange(newType: string) {
        if (this.valueType === newType) return;

        this.valueType = newType as any;

        // Convert value if possible or reset
        if (newType === 'string') {
            this.value = String(this.value);
        } else if (newType === 'number') {
            this.value = Number(this.value) || 0;
        } else if (newType === 'boolean') {
            this.value = Boolean(this.value);
        } else if (newType === 'object') {
            this.value = {};
        } else if (newType === 'array') {
            this.value = [];
        }
        
        this.valueChange.emit(this.value);
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    addChild() {
        if (this.valueType === 'object') {
            const newKey = 'newKey' + Object.keys(this.value).length;
            this.value = { ...this.value, [newKey]: '' };
        } else if (this.valueType === 'array') {
            this.value = [...this.value, ''];
        }
        this.valueChange.emit(this.value);
        this.isExpanded = true;
    }

    onChildKeyChange(oldKey: string, newKey: string) {
        if (this.valueType === 'object' && oldKey !== newKey) {
            // Preserve key order by rebuilding the object
            const entries = Object.entries(this.value);
            const newEntries = entries.map(([k, v]) => {
                if (k === oldKey) {
                    return [newKey, v];
                }
                return [k, v];
            });
            this.value = Object.fromEntries(newEntries);
            this.valueChange.emit(this.value);
        }
    }

    onChildValueChange(keyOrIndex: string | number, newValue: any) {
        if (this.valueType === 'object') {
            this.value = { ...this.value, [keyOrIndex]: newValue };
        } else if (this.valueType === 'array') {
            const newArray = [...this.value];
            newArray[keyOrIndex as number] = newValue;
            this.value = newArray;
        }
        this.valueChange.emit(this.value);
    }

    onChildDelete(keyOrIndex: string | number) {
        if (this.valueType === 'object') {
            const newValue = { ...this.value };
            delete newValue[keyOrIndex];
            this.value = newValue;
        } else if (this.valueType === 'array') {
            this.value = this.value.filter((_, i) => i !== keyOrIndex);
        }
        this.valueChange.emit(this.value);
    }

    // Helper for template iteration
    getObjectKeys(obj: any): string[] {
        return obj ? Object.keys(obj) : [];
    }
    
    getArrayIndices(arr: any[]): number[] {
        return arr ? arr.map((_, i) => i) : [];
    }

    // TrackBy functions to prevent re-rendering
    trackByKey(index: number, key: string): string {
        return key;
    }

    trackByIndex(index: number): number {
        return index;
    }
}
