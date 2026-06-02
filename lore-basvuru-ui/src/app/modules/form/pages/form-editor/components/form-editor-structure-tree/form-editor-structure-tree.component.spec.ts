import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormDto, PageDto, QuestionDto } from '../../../../models';
import { FormEditorStructureTreeComponent } from './form-editor-structure-tree.component';

@Component({
    standalone: true,
    imports: [CommonModule, FormEditorStructureTreeComponent],
    template: `
        <app-form-editor-structure-tree
            *ngIf="isVisible"
            [form]="form"
            [activePageEid]="'page-1'"
            [selectedNodeEid]="selectedNodeEid"
            [collapsedPageEids]="collapsedPageEids"
            [collapsedQuestionEids]="collapsedQuestionEids"
            [revealNodeEid]="revealNodeEid"
            [revealRevision]="revealRevision"
            (nodeSelect)="nodeSelections.push($event)"
            (pageToggle)="pageToggles.push($event)"
            (questionToggle)="questionToggles.push($event)"></app-form-editor-structure-tree>
    `,
})
class StructureTreeHostComponent {
    isVisible = true;
    selectedNodeEid = 'page-1';
    collapsedPageEids: string[] = [];
    collapsedQuestionEids: string[] = [];
    revealNodeEid: string | null = null;
    revealRevision = 0;
    nodeSelections: string[] = [];
    pageToggles: string[] = [];
    questionToggles: string[] = [];
    form: FormDto = {
        eid: 'form-1',
        sayfalar: [
            {
                eid: 'page-1',
                sayfaNo: 1,
                sayfaBaslik: 'Sayfa 1',
                sorular: [
                    {
                        eid: 'q-1',
                        soruMetni: '<p>Soru 1</p>',
                        altSorular: [{ eid: 'q-1-1', soruMetni: '<p>Alt Soru</p>', altSorular: [] } as QuestionDto],
                    } as QuestionDto,
                ],
            } as PageDto,
        ],
    } as FormDto;
}

describe('FormEditorStructureTreeComponent', () => {
    let fixture: ComponentFixture<StructureTreeHostComponent>;
    let host: StructureTreeHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StructureTreeHostComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(StructureTreeHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders collapse state from inputs', () => {
        host.collapsedPageEids = ['page-1'];
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Soru 1');
    });

    it('emits page and node interactions', () => {
        const pageButton = fixture.debugElement.query(By.css('.struct-card--page'));
        pageButton.nativeElement.click();

        expect(host.nodeSelections).toEqual(['page-1']);
        expect(host.pageToggles).toEqual(['page-1']);
    });

    it('scrolls to the reveal target when the revision changes', fakeAsync(() => {
        const target = fixture.nativeElement.querySelector('[data-tree-eid="q-1"]') as HTMLElement & {
            scrollIntoView: jasmine.Spy;
        };
        target.scrollIntoView = jasmine.createSpy('scrollIntoView');

        host.revealNodeEid = 'q-1';
        host.revealRevision = 1;
        fixture.detectChanges();
        tick(60);

        expect(target.scrollIntoView).toHaveBeenCalled();
    }));

    it('keeps collapse state when the component remounts', () => {
        host.collapsedPageEids = ['page-1'];
        host.isVisible = false;
        fixture.detectChanges();

        host.isVisible = true;
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Soru 1');
    });
});
