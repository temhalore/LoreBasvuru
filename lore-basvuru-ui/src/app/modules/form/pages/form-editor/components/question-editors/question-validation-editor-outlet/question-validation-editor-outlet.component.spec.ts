import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { KuralEditorConfigModel, KuralKosulV2Model, ResKuralV2Model } from 'app/base/models/form/kuralV2';
import { QuestionDto } from 'app/modules/form/models';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { CodeSelectInputComponent } from 'app/shared/components/form-controls/code-select-input/code-select-input.component';
import { DatepickerInputComponent } from 'app/shared/components/form-controls/datepicker-input/datepicker-input.component';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { QuestionValidationEditorOutletComponent } from './question-validation-editor-outlet.component';

@Component({
    selector: 'app-action-button',
    standalone: true,
    template: `
        <button type="button" [disabled]="disabled || loading" (click)="onClick.emit()">
            {{ label }}
        </button>
    `,
})
class ActionButtonStubComponent {
    @Input() label = '';
    @Input() icon = '';
    @Input() variant: string = 'primary';
    @Input() outline = false;
    @Input() disabled = false;
    @Input() loading = false;
    @Input() loadingText = '';

    @Output() readonly onClick = new EventEmitter<void>();
}

@Component({
    selector: 'app-api-select-input',
    standalone: true,
    template: '',
})
class ApiSelectInputStubComponent {
    @Input() nameOfFormGroup: FormGroup | null = null;
    @Input() controlName = '';
    @Input() title = '';
    @Input() placeHolder = '';
    @Input() apiUrl = '';
    @Input() displayField = '';
    @Input() apiParam: unknown;
    @Input() isRequired = false;
}

@Component({
    selector: 'app-code-select-input',
    standalone: true,
    template: '',
})
class CodeSelectInputStubComponent {
    @Input() nameOfFormGroup: FormGroup | null = null;
    @Input() controlName = '';
    @Input() title = '';
    @Input() placeHolder = '';
    @Input() code = 0;
    @Input() isMultiple = false;
    @Input() includeIds: number[] = [];
    @Input() isRequired = false;

    @Output() readonly selectChangeEvent = new EventEmitter<void>();
}

@Component({
    selector: 'app-datepicker-input',
    standalone: true,
    template: '',
})
class DatepickerInputStubComponent {
    @Input() formGroup: FormGroup | null = null;
    @Input() controlName = '';
    @Input() label = '';
    @Input() dateType = '';
}

describe('QuestionValidationEditorOutletComponent', () => {
    beforeEach(async () => {
        const sweetAlertSpy = jasmine.createSpyObj<SweetAlertService>('SweetAlertService', ['confirm']);
        sweetAlertSpy.confirm.and.returnValue(Promise.resolve(true));

        await TestBed.configureTestingModule({
            imports: [QuestionValidationEditorOutletComponent, NoopAnimationsModule],
            providers: [{ provide: SweetAlertService, useValue: sweetAlertSpy }],
        })
            .overrideComponent(QuestionValidationEditorOutletComponent, {
                remove: {
                    imports: [
                        ActionButtonComponent,
                        ApiSelectInputComponent,
                        CodeSelectInputComponent,
                        DatepickerInputComponent,
                    ],
                },
                add: {
                    imports: [
                        ActionButtonStubComponent,
                        ApiSelectInputStubComponent,
                        CodeSelectInputStubComponent,
                        DatepickerInputStubComponent,
                    ],
                },
            })
            .compileComponents();
    });

    it('shows unsupported state and hides the accordion rule list for unsupported question types', fakeAsync(() => {
        const fixture = renderInputDriven(1050015, buildUnsupportedConfig(), [buildRule('rule-1')]);

        expect(fixture.nativeElement.querySelector('.validation-editor__rule-stack')).toBeNull();
        expect(fixture.nativeElement.querySelector('.validation-editor__form')).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Bu soru tipi için validasyon desteklenmiyor');
        expect(getActionButtonsByLabel(fixture, 'Iptal').length).toBe(1);
    }));

    it('fails closed when the backend config has no entry for the current question type', fakeAsync(() => {
        // buildSupportedConfig yalnızca 1050001 için giriş içerir; 1050015 yok →
        // fail-closed: desteklenmez mesajı + form gizli.
        const fixture = renderInputDriven(1050015, buildSupportedConfig(), [buildRule('rule-1')]);

        expect(fixture.nativeElement.querySelector('.validation-editor__rule-stack')).toBeNull();
        expect(fixture.nativeElement.querySelector('.validation-editor__form')).toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Bu soru tipi icin validasyon tanimlanamaz.');
    }));

    it('shows a single-column empty rule list with add row and global close action', fakeAsync(() => {
        const fixture = renderInputDriven(1050001, buildSupportedConfig(), []);

        expect(fixture.nativeElement.querySelector('.validation-editor__rule-stack')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('.validation-editor__rule-row--create')).not.toBeNull();
        expect(fixture.nativeElement.textContent).toContain('Bu soru icin henuz validasyon kurali yok');
        expect(fixture.nativeElement.querySelectorAll('.validation-editor__rule-row--expanded').length).toBe(0);
        expect(getActionButtonsByLabel(fixture, 'Iptal').length).toBe(1);
        expect(getActionButtonsByLabel(fixture, 'Kaydet').length).toBe(0);
    }));

    it('keeps rules compact by default and allows only one expanded rule at a time', fakeAsync(() => {
        const fixture = renderInputDriven(1050001, buildSupportedConfig(), [
            buildRule('rule-1', 'Birinci mesaj', 1, true),
            buildRule('rule-2', 'Ikinci mesaj', 1, false),
        ]);

        const compactButtons = getCompactRuleButtons(fixture);
        expect(fixture.nativeElement.querySelectorAll('.validation-editor__rule-row--expanded').length).toBe(0);

        compactButtons[0].click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('.validation-editor__rule-row--expanded').length).toBe(1);
        expect(fixture.nativeElement.textContent).toContain('Birinci mesaj');
        expect(getActionButtonsByLabel(fixture, 'Kurali Uygula').length).toBe(1);
        expect(getActionButtonsByLabel(fixture, 'Sil').length).toBe(1);
        expect(getActionButtonsByLabel(fixture, 'Iptal').length).toBe(1);

        compactButtons[1].click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('.validation-editor__rule-row--expanded').length).toBe(1);
        expect(fixture.nativeElement.querySelector('.validation-editor__rule-row--pasif.validation-editor__rule-row--expanded')).not.toBeNull();

        compactButtons[1].click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('.validation-editor__rule-row--expanded').length).toBe(0);
    }));

    it('opens the new rule row inline and keeps add-condition behavior inside the expanded card', fakeAsync(() => {
        const fixture = renderInputDriven(1050001, buildSupportedConfig(), []);
        const component = fixture.componentInstance;

        getCreateRuleButton(fixture).click();
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.validation-editor__rule-row--create.validation-editor__rule-row--expanded')).not.toBeNull();
        expect(fixture.nativeElement.querySelectorAll('mat-slide-toggle').length).toBe(2);
        expect(getActionButtonsByLabel(fixture, 'Kurali Ekle').length).toBe(1);
        expect(getActionButtonsByLabel(fixture, 'Sil').length).toBe(0);
        expect(getActionButtonsByLabel(fixture, 'Iptal').length).toBe(1);

        getSingleActionButton(fixture, 'Koşul ekle').click();
        fixture.detectChanges();

        expect(component.kosullarArray.length).toBe(1);
        expect(fixture.nativeElement.querySelector('.validation-editor__condition-shell--open')).toBeNull();

        tick(20);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('.validation-editor__condition-shell--open')).not.toBeNull();
        expect(getSingleActionButton(fixture, 'Kurali Ekle').disabled).toBeFalse();
    }));

    // Component artık input-driven: editorConfig/session store'dan @Input ile
    // gelir (KuralV2Service'i kendisi çağırmaz). Bu helper o sözleşmeyi sürer.
    function renderInputDriven(
        soruTipKID: number,
        editorConfig: KuralEditorConfigModel | null,
        rules: ResKuralV2Model[] = [],
    ): ComponentFixture<QuestionValidationEditorOutletComponent> {
        const fixture = TestBed.createComponent(QuestionValidationEditorOutletComponent);
        fixture.componentRef.setInput('question', buildQuestion(soruTipKID));
        fixture.componentRef.setInput('editorConfig', editorConfig);
        fixture.componentRef.setInput('isLoading', false);
        fixture.componentRef.setInput('session', {
            questionEid: 'question-root-1',
            rules: rules.map((rule) => ({ rule, state: 'existing' as const })),
            activeRuleEid: null,
            isDirty: false,
        });
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        return fixture;
    }
});

function buildSupportedConfig(): KuralEditorConfigModel {
    return {
        items: [
            {
                soruTipId: 1050001,
                supportsValidation: true,
                unsupportedMessage: '',
                kosulTipleri: [
                    {
                        kosulTipId: 2020001,
                        operatorIdList: [2030001],
                        degerTipiMode: 'hidden',
                        fixedDegerTipiId: null,
                        selectableDegerTipiIdList: [],
                        secondValueOperatorIdList: [],
                        degerInputTip: 'metin',
                        degerLabel: 'Deger',
                        deger2Label: 'Deger 2',
                        showDeger: true,
                        showSecenek: false,
                        showDosyaKisitAlanlari: false,
                    },
                ],
            },
        ],
    };
}

function buildUnsupportedConfig(): KuralEditorConfigModel {
    return {
        items: [
            {
                soruTipId: 1050015,
                supportsValidation: false,
                unsupportedMessage: 'Bu soru tipinde validasyon desteklenmez.',
                kosulTipleri: [],
            },
        ],
    };
}

function buildQuestion(soruTipKID: number): QuestionDto {
    return {
        eid: 'question-1',
        soruTipKID,
        soruMetni: '<p>Deneme sorusu</p>',
        soruKokEidDto: { eid: 'question-root-1' },
        formKokEidDto: { eid: 'form-root-1' },
    } as QuestionDto;
}

function buildRule(eid: string, hataMesaji = 'Ornek mesaj', kosulSayisi = 0, isAktif = true): ResKuralV2Model {
    return {
        eid,
        sira: 1,
        isAktif,
        kuralDetay: {
            hataMesaji,
            isZorunlu: false,
            kosullar: Array.from({ length: kosulSayisi }, () => buildCondition()),
            hedefSayfaEIdDto: null,
            hedefSoruKokEIdDto: null,
        },
    } as ResKuralV2Model;
}

function buildCondition(): KuralKosulV2Model {
    return {
        kosulTipKodDto: null,
        soruKokEIdDto: null,
        secenekEIdDto: null,
        matrisSatirEIdDto: null,
        matrisSutunEIdDto: null,
        operatorKodDto: null,
        degerTipiKodDto: null,
        deger: '',
        deger2: '',
        joinKodDto: null,
        maxDosyaBoyutuMB: null,
        minDosyaSayisi: null,
        maxDosyaSayisi: null,
        izinVerilenDosyaTipleri: null,
        hataMesaji: '',
    } as KuralKosulV2Model;
}

function getActionButtonsByLabel(
    fixture: ComponentFixture<QuestionValidationEditorOutletComponent>,
    label: string,
): HTMLButtonElement[] {
    return fixture.debugElement
        .queryAll(By.directive(ActionButtonStubComponent))
        .filter((item) => item.componentInstance.label === label)
        .map((item) => item.nativeElement.querySelector('button') as HTMLButtonElement);
}

function getSingleActionButton(
    fixture: ComponentFixture<QuestionValidationEditorOutletComponent>,
    label: string,
): HTMLButtonElement {
    const buttons = getActionButtonsByLabel(fixture, label);
    if (buttons.length !== 1) {
        throw new Error(`Expected a single action button for label: ${label}`);
    }

    return buttons[0];
}

function getCompactRuleButtons(fixture: ComponentFixture<QuestionValidationEditorOutletComponent>): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.validation-editor__rule-list .validation-editor__rule-compact'))
        .slice(0, 2) as HTMLButtonElement[];
}

function getCreateRuleButton(fixture: ComponentFixture<QuestionValidationEditorOutletComponent>): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.validation-editor__rule-row--create .validation-editor__rule-compact') as HTMLButtonElement;
}
