// TODO: Hiçbir yerde kullanılmıyor. Kaldırılacak!

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { JsonNodeComponent } from './json-node/json-node.component';

@Component({
    selector: 'app-json-tree-editor',
    templateUrl: './json-tree-editor.component.html',
    styleUrls: ['./json-tree-editor.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        JsonNodeComponent
    ]
})
export class JsonTreeEditorComponent implements OnChanges {
    @Input() jsonData: string = '{}';
    @Output() jsonDataChange = new EventEmitter<string>();

    data: any = {};
    isValid: boolean = true;
    errorMessage: string = '';
    private isInternalChange: boolean = false;

    ngOnChanges(changes: SimpleChanges) {
        if (changes['jsonData']) {
            // Skip re-parsing if this change was triggered by our own emit
            if (this.isInternalChange) {
                this.isInternalChange = false;
                return;
            }
            this.parseJson();
        }
    }

    parseJson() {
        try {
            if (!this.jsonData || this.jsonData.trim() === '') {
                this.data = {};
                this.isValid = true;
                return;
            }
            this.data = JSON.parse(this.jsonData);
            this.isValid = true;
            this.errorMessage = '';
        } catch (e: any) {
            this.isValid = false;
            this.errorMessage = e.message;
            console.error('JSON Parse Error:', e);
        }
    }

    onDataChange(newData: any) {
        this.data = newData;
        this.emitChange();
    }

    emitChange() {
        try {
            const jsonString = JSON.stringify(this.data, null, 2);
            this.isInternalChange = true;
            this.jsonDataChange.emit(jsonString);
        } catch (e) {
            console.error('JSON Stringify Error:', e);
        }
    }

    addRootItem() {
        if (Array.isArray(this.data)) {
            this.data = [...this.data, ''];
        } else if (typeof this.data === 'object' && this.data !== null) {
            const newKey = 'newKey' + Object.keys(this.data).length;
            this.data = { ...this.data, [newKey]: '' };
        } else {
            // If root is primitive, convert to object to allow adding
            this.data = { value: this.data, newKey: '' };
        }
        this.emitChange();
    }
}
