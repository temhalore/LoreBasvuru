// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';

interface JsonNode {
    key: string;
    value: any;
    type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    expanded: boolean;
    children?: JsonNode[];
}

@Component({
    selector: 'app-json-viewer',
    templateUrl: './json-viewer.component.html',
    styleUrls: ['./json-viewer.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule
    ]
})
export class JsonViewerComponent implements OnChanges {
    @Input() json: any;
    @Input() title?: string;
    @Input() expandLevel: number = 1;

    nodes: JsonNode[] = [];
    isAllExpanded: boolean = false;
    copied: boolean = false;

    constructor(private clipboard: Clipboard) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['json']) {
            this.parseJson();
        }
    }

    private parseJson(): void {
        if (!this.json) {
            this.nodes = [];
            return;
        }

        let data = this.json;
        
        // If JSON is a string, try to parse it
        if (typeof this.json === 'string') {
            try {
                data = JSON.parse(this.json);
            } catch (e) {
                // If parsing fails, treat as string value
                this.nodes = [{
                    key: 'value',
                    value: this.json,
                    type: 'string',
                    expanded: false
                }];
                return;
            }
        }

        this.nodes = this.buildNodes(data, 0);
    }

    private buildNodes(data: any, level: number, parentKey: string = ''): JsonNode[] {
        if (data === null) {
            return [{
                key: parentKey || 'null',
                value: null,
                type: 'null',
                expanded: false
            }];
        }

        if (Array.isArray(data)) {
            return data.map((item, index) => this.createNode(String(index), item, level));
        }

        if (typeof data === 'object') {
            return Object.keys(data).map(key => this.createNode(key, data[key], level));
        }

        return [{
            key: parentKey || 'value',
            value: data,
            type: this.getType(data),
            expanded: false
        }];
    }

    private createNode(key: string, value: any, level: number): JsonNode {
        const type = this.getType(value);
        const isExpandable = type === 'object' || type === 'array';
        const expanded = isExpandable && level < this.expandLevel;

        const node: JsonNode = {
            key,
            value,
            type,
            expanded
        };

        if (isExpandable && value !== null) {
            node.children = this.buildNodes(value, level + 1, key);
        }

        return node;
    }

    private getType(value: any): 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        return 'string';
    }

    toggleNode(node: JsonNode): void {
        if (node.type === 'object' || node.type === 'array') {
            node.expanded = !node.expanded;
        }
    }

    toggleAll(): void {
        this.isAllExpanded = !this.isAllExpanded;
        this.setExpandState(this.nodes, this.isAllExpanded);
    }

    private setExpandState(nodes: JsonNode[], expanded: boolean): void {
        nodes.forEach(node => {
            if (node.type === 'object' || node.type === 'array') {
                node.expanded = expanded;
                if (node.children) {
                    this.setExpandState(node.children, expanded);
                }
            }
        });
    }

    copyToClipboard(): void {
        const jsonString = typeof this.json === 'string' 
            ? this.json 
            : JSON.stringify(this.json, null, 2);
        this.clipboard.copy(jsonString);
        this.copied = true;
        setTimeout(() => this.copied = false, 2000);
    }

    getArrayLength(value: any): number {
        return Array.isArray(value) ? value.length : 0;
    }

    getObjectKeys(value: any): number {
        return value && typeof value === 'object' ? Object.keys(value).length : 0;
    }

    formatValue(value: any, type: string): string {
        if (type === 'null') return 'null';
        if (type === 'string') return `"${value}"`;
        if (type === 'boolean') return value ? 'true' : 'false';
        return String(value);
    }

    isExpandable(node: JsonNode): boolean {
        return node.type === 'object' || node.type === 'array';
    }
}

