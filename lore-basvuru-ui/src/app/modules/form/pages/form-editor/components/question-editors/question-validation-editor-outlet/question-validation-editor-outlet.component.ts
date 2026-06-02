import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject, takeUntil } from 'rxjs';
import { KosulSatirCase, KuralEditorConfigModel, KuralKosulV2Model, KuralV2JsonModel, ResKuralV2Model, SoruTipKuralEditorConfigModel } from 'app/base/models/form/kuralV2';
import { KodModel } from 'app/base/models/common/kod.model';
import { EidModel } from 'app/base/models/general/eid.model';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';
import { ApiSelectInputComponent } from 'app/shared/components/form-controls/api-select-input/api-select-input.component';
import { CodeSelectInputComponent } from 'app/shared/components/form-controls/code-select-input/code-select-input.component';
import { DatepickerInputComponent } from 'app/shared/components/form-controls/datepicker-input/datepicker-input.component';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { QuestionDto } from '../../../../../models';
import { richTextToPlainText } from '../../../../../shared/utils/rich-text.util';
import { FORM_EDITOR_CONFIRM } from '../../../form-editor.messages';
import { FormEditorValidationRuleDraft, FormEditorValidationSession } from '../../../models/form-editor-view.model';
import { buildDraftRuleEid, cloneRule, cloneRuleDrafts } from '../../../services/kural-v2-rule.mapper';
import {
    DEGER_TIPI_KOD_ID,
    JOIN_KOD_ID,
    KOSUL_TIPI_KOD_ID,
    KURAL_TIPI_VALIDASYON,
    OPERATOR_KOD_ID,
    DOSYA_UZANTI_TIPI_KOD_ID,
    getSoruTipValidationSupportState,
    hesaplaKosulSatirCase,
} from 'app/modules/form/shared/rule-v2/kural-v2-editor.utils';

@Component({
    selector: 'app-question-validation-editor-outlet',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        ActionButtonComponent,
        ApiSelectInputComponent,
        CodeSelectInputComponent,
        DatepickerInputComponent,
    ],
    templateUrl: './question-validation-editor-outlet.component.html',
    styleUrls: ['./question-validation-editor-outlet.component.scss'],
})
export class QuestionValidationEditorOutletComponent implements OnChanges, OnDestroy {
    @Input() question: QuestionDto | null = null;
    @Input() session: FormEditorValidationSession | null = null;
    @Input() editorConfig: KuralEditorConfigModel | null = null;
    @Input() isLoading = false;
    @Input() isSaving = false;
    @Input() error: string | null = null;

    @Output() readonly close = new EventEmitter<string>();
    @Output() readonly save = new EventEmitter<FormEditorValidationSession>();

    readonly KOSUL_TIPI_KOD_ID = KOSUL_TIPI_KOD_ID;
    readonly OPERATOR_KOD_ID = OPERATOR_KOD_ID;
    readonly JOIN_KOD_ID = JOIN_KOD_ID;
    readonly DEGER_TIPI_KOD_ID = DEGER_TIPI_KOD_ID;
    readonly DOSYA_UZANTI_TIPI_KOD_ID = DOSYA_UZANTI_TIPI_KOD_ID;

    readonly formGroup = this.fb.group({
        eid: [''],
        hataMesaji: [''],
        isZorunlu: [false],
        isAktif: [true],
        sira: [0, [Validators.required, Validators.min(0)]],
        kosullar: this.fb.array([]),
    });

    rules: FormEditorValidationRuleDraft[] = [];
    kosulCases: KosulSatirCase[] = [];
    activeRuleEid: string | null = null;
    questionApiParam: { eid: string } | null = null;
    isCreatingNew = false;
    localError: string | null = null;
    conditionRevealStates: boolean[] = [];
    sessionDirty = false;

    private readonly destroy$ = new Subject<void>();
    private conditionRevealTimer: ReturnType<typeof setTimeout> | null = null;
    private localDraftCounter = 0;

    constructor(
        private readonly fb: FormBuilder,
        private readonly cdr: ChangeDetectorRef,
        private readonly sweetAlert: SweetAlertService,
    ) {}

    get kosullarArray(): FormArray {
        return this.formGroup.get('kosullar') as FormArray;
    }

    get questionKokEid(): string {
        return this.question?.soruKokEidDto?.eid ?? this.question?.eid ?? '';
    }

    get formKokEid(): string {
        return this.question?.formKokEidDto?.eid ?? '';
    }

    get questionTitle(): string {
        return richTextToPlainText(this.question?.soruMetni) || 'Adsiz soru';
    }

    get isConfigReady(): boolean {
        return this.editorConfig !== null;
    }

    private get validationSupportState() {
        return getSoruTipValidationSupportState(this.editorConfig, this.question?.soruTipKID ?? 0);
    }

    get unsupportedQuestionConfig(): SoruTipKuralEditorConfigModel | null {
        if (!this.isConfigReady) {
            return null;
        }

        const supportState = this.validationSupportState;
        return supportState.supported ? null : supportState.config;
    }

    get unsupportedMessage(): string {
        if (!this.isConfigReady) {
            return 'Bu soru tipi icin validasyon tanimlanamaz.';
        }

        return this.validationSupportState.unsupportedMessage || 'Bu soru tipi icin validasyon tanimlanamaz.';
    }

    get isQuestionValidationSupported(): boolean {
        if (!this.isConfigReady) {
            return false;
        }

        // Fail-closed: destek durumu doğrudan support state'ten okunur.
        // (config null olduğunda "desteklenmiyor"u "destekleniyor" sanmamak için —
        // eski `unsupportedQuestionConfig === null` türetimi unknown tipte
        // fail-OPEN oluyordu.)
        return this.validationSupportState.supported;
    }

    get showUnsupportedState(): boolean {
        return this.isConfigReady && !this.isQuestionValidationSupported;
    }

    get showRuleListState(): boolean {
        return this.isConfigReady && !this.isLoading && !this.showUnsupportedState;
    }

    get showRuleListEmptyHint(): boolean {
        return this.showRuleListState && this.visibleRules.length === 0 && !this.isCreatingNew;
    }

    get showLoadingState(): boolean {
        return (!this.isConfigReady || this.isLoading) && !this.showUnsupportedState;
    }

    get showSharedFooter(): boolean {
        return Boolean(this.question);
    }

    get hasExpandedRule(): boolean {
        return this.isCreatingNew || this.activeRuleEid !== null;
    }

    get emptyRuleListText(): string {
        return 'Bu soru icin henuz validasyon kurali yok. Asagidan yeni bir kural olusturarak baslayabilirsiniz.';
    }

    get visibleRules(): FormEditorValidationRuleDraft[] {
        return this.rules.filter((ruleDraft) => ruleDraft.state !== 'deleted');
    }

    get visibleError(): string | null {
        return this.localError || this.error;
    }

    get hasUnsavedChanges(): boolean {
        return this.sessionDirty || this.formGroup.dirty;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['question']) {
            this.questionApiParam = this.questionKokEid ? { eid: this.questionKokEid } : null;

            if (!this.questionKokEid) {
                this.rules = [];
                this.sessionDirty = false;
                this.localError = null;
                this.clearActiveRule();
            }
        }

        if (changes['session']) {
            this.applySession(this.session);
        }

        if (changes['editorConfig']) {
            if (this.showUnsupportedState) {
                this.clearActiveRule();
            }
            if (this.kosullarArray.length > 0) {
                this.refreshKosulCases();
            }
        }
    }

    selectRule(ruleDraft: FormEditorValidationRuleDraft): void {
        if (!this.confirmDiscardCurrentRule()) {
            return;
        }

        this.activeRuleEid = ruleDraft.rule.eid;
        this.isCreatingNew = false;
        this.localError = null;
        this.fillForm(ruleDraft.rule);
    }

    startCreateRule(): void {
        if (!this.confirmDiscardCurrentRule()) {
            return;
        }

        if (!this.isConfigReady || !this.isQuestionValidationSupported) {
            return;
        }

        this.activeRuleEid = this.buildDraftRuleEid();
        this.isCreatingNew = true;
        this.localError = null;
        this.resetForm(this.nextRuleSira());
    }

    clearActiveRule(): void {
        this.activeRuleEid = null;
        this.isCreatingNew = false;
        this.localError = null;
        this.resetForm();
    }

    get hasActiveRuleContext(): boolean {
        return this.isCreatingNew || this.activeRuleEid !== null;
    }

    toggleRule(ruleDraft: FormEditorValidationRuleDraft): void {
        if (this.isCreatingNew) {
            this.selectRule(ruleDraft);
            return;
        }

        if (this.activeRuleEid === ruleDraft.rule.eid) {
            if (!this.confirmDiscardCurrentRule()) {
                return;
            }
            this.clearActiveRule();
            return;
        }

        this.selectRule(ruleDraft);
    }

    toggleCreateRule(): void {
        if (this.isCreatingNew) {
            if (!this.confirmDiscardCurrentRule()) {
                return;
            }
            this.clearActiveRule();
            return;
        }

        this.startCreateRule();
    }

    kosulAsFormGroup(index: number): FormGroup {
        return this.kosullarArray.at(index) as FormGroup;
    }

    kosulEkle(): void {
        if (!this.isConfigReady) {
            this.localError = 'Editor hazirlaniyor. Lutfen tekrar deneyin.';
            return;
        }

        if (!this.isQuestionValidationSupported) {
            this.localError = 'Bu soru tipi icin validasyon tanimlanamaz.';
            return;
        }

        const group = this.buildKosulGroup(new KuralKosulV2Model());
        this.kosullarArray.push(group);
        this.conditionRevealStates.push(false);
        this.subscribeKosulChanges(group);
        this.refreshKosulCases();
        this.scheduleConditionReveal(this.kosullarArray.length - 1);
    }

    kosulKaldir(index: number): void {
        this.kosullarArray.removeAt(index);
        this.conditionRevealStates.splice(index, 1);
        this.refreshKosulCases();
    }

    saveRule(): void {
        if (!this.questionKokEid || !this.formKokEid) {
            this.localError = 'Soru baglami bulunamadi.';
            return;
        }

        if (this.kosullarArray.length === 0) {
            this.localError = 'En az bir kosul eklemelisiniz.';
            return;
        }

        if (this.formGroup.invalid) {
            this.formGroup.markAllAsTouched();
            this.localError = 'Lutfen zorunlu alanlari tamamlayin.';
            return;
        }

        this.localError = null;

        const nextRule = this.buildRuleModel();
        const existingIndex = this.rules.findIndex((ruleDraft) => ruleDraft.rule.eid === nextRule.eid);

        if (existingIndex >= 0) {
            const currentState = this.rules[existingIndex].state === 'new' ? 'new' : 'existing';
            this.rules.splice(existingIndex, 1, {
                rule: nextRule,
                state: currentState,
            });
        } else {
            this.rules = [
                ...this.rules,
                {
                    rule: nextRule,
                    state: 'new',
                },
            ];
        }

        this.rules = this.rules
            .slice()
            .sort((left, right) => (left.rule.sira ?? 0) - (right.rule.sira ?? 0));
        this.sessionDirty = true;
        this.activeRuleEid = nextRule.eid;
        this.isCreatingNew = false;
        this.fillForm(nextRule);
    }

    deleteActiveRule(): void {
        const activeRuleIndex = this.rules.findIndex((ruleDraft) => ruleDraft.rule.eid === this.activeRuleEid);
        if (activeRuleIndex < 0) {
            return;
        }

        const activeRule = this.rules[activeRuleIndex];
        this.localError = null;

        if (activeRule.state === 'new') {
            this.rules = this.rules.filter((ruleDraft) => ruleDraft.rule.eid !== activeRule.rule.eid);
        } else {
            this.rules.splice(activeRuleIndex, 1, {
                rule: activeRule.rule,
                state: 'deleted',
            });
        }

        this.sessionDirty = true;
        this.clearActiveRule();
        this.cdr.markForCheck();
    }

    async closeEditor(): Promise<void> {
        if (this.hasUnsavedChanges
            && !(await this.sweetAlert.confirm(FORM_EDITOR_CONFIRM.discardTitle, FORM_EDITOR_CONFIRM.discardText))) {
            return;
        }

        if (this.question?.eid) {
            this.close.emit(this.question.eid);
        }
    }

    commitSession(): void {
        if (!this.questionKokEid || this.isSaving) {
            return;
        }

        if (this.formGroup.dirty && this.hasActiveRuleContext) {
            this.saveRule();
            if (this.visibleError) {
                return;
            }
        }

        this.save.emit({
            questionEid: this.questionKokEid,
            rules: cloneRuleDrafts(this.rules),
            activeRuleEid: this.activeRuleEid,
            isDirty: this.hasUnsavedChanges,
        });
    }

    onKosulConfigSelectionChange(): void {
        this.refreshKosulCases();
    }

    trackByRule(_: number, ruleDraft: FormEditorValidationRuleDraft): string {
        return ruleDraft.rule.eid;
    }

    trackByKosul(index: number): number {
        return index;
    }

    isConditionRevealed(index: number): boolean {
        return this.conditionRevealStates[index] !== false;
    }

    isRuleExpanded(ruleDraft: FormEditorValidationRuleDraft): boolean {
        return !this.isCreatingNew && this.activeRuleEid === ruleDraft.rule.eid;
    }

    isCreateRuleExpanded(): boolean {
        return this.isCreatingNew;
    }

    getRuleMessage(ruleDraft: FormEditorValidationRuleDraft | null): string {
        return ruleDraft?.rule.kuralDetay?.hataMesaji || 'Mesaj tanimlanmadi';
    }

    getRuleConditionCount(ruleDraft: FormEditorValidationRuleDraft | null): number {
        return ruleDraft?.rule.kuralDetay?.kosullar?.length ?? 0;
    }

    ngOnDestroy(): void {
        this.clearConditionRevealTimer();
        this.destroy$.next();
        this.destroy$.complete();
    }

    private applySession(session: FormEditorValidationSession | null): void {
        if (!session) {
            this.rules = [];
            this.sessionDirty = false;
            this.clearActiveRule();
            return;
        }

        this.rules = cloneRuleDrafts(session.rules);
        this.sessionDirty = false;
        this.localError = null;

        const nextActiveRule = session.activeRuleEid
            ? this.visibleRules.find((ruleDraft) => ruleDraft.rule.eid === session.activeRuleEid) ?? null
            : null;

        if (nextActiveRule) {
            this.activeRuleEid = nextActiveRule.rule.eid;
            this.isCreatingNew = false;
            this.fillForm(nextActiveRule.rule);
            return;
        }

        this.clearActiveRule();
    }

    private buildKosulGroup(kosul: KuralKosulV2Model): FormGroup {
        return this.fb.group({
            kosulTipKodDto: [kosul.kosulTipKodDto],
            soruKokEIdDto: [kosul.soruKokEIdDto],
            secenekEIdDto: [kosul.secenekEIdDto],
            matrisSatirEIdDto: [kosul.matrisSatirEIdDto],
            matrisSutunEIdDto: [kosul.matrisSutunEIdDto],
            operatorKodDto: [kosul.operatorKodDto],
            degerTipiKodDto: [kosul.degerTipiKodDto],
            deger: [kosul.deger],
            deger2: [kosul.deger2],
            joinKodDto: [kosul.joinKodDto],
            maxDosyaBoyutuMB: [kosul.maxDosyaBoyutuMB],
            minDosyaSayisi: [kosul.minDosyaSayisi],
            maxDosyaSayisi: [kosul.maxDosyaSayisi],
            izinVerilenDosyaTipleri: [kosul.izinVerilenDosyaTipleri ?? null],
            hataMesaji: [kosul.hataMesaji ?? ''],
        });
    }

    private subscribeKosulChanges(group: FormGroup): void {
        group.get('kosulTipKodDto')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshKosulCases());
        group.get('operatorKodDto')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshKosulCases());
        group.get('degerTipiKodDto')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshKosulCases());
    }

    private refreshKosulCases(): void {
        const soruTipKID = this.question?.soruTipKID ?? 0;
        this.kosulCases = this.kosullarArray.controls.map((ctrl) => {
            const kosulTipId = this.getKodId(ctrl.get('kosulTipKodDto')?.value);
            const operatorId = this.getKodId(ctrl.get('operatorKodDto')?.value);
            const degerTipiId = this.getKodId(ctrl.get('degerTipiKodDto')?.value);
            const satirCase = hesaplaKosulSatirCase(kosulTipId, operatorId, degerTipiId, soruTipKID, this.editorConfig);
            if (this.editorConfig && soruTipKID > 0) {
                this.applyKosulCaseToForm(ctrl as FormGroup, satirCase);
            }
            return satirCase;
        });
        this.cdr.markForCheck();
    }

    private applyKosulCaseToForm(group: FormGroup, satirCase: KosulSatirCase): void {
        if (satirCase.degerTipiMode === 'fixed' && satirCase.fixedDegerTipiId) {
            const currentId = this.getKodId(group.get('degerTipiKodDto')?.value);
            if (currentId !== satirCase.fixedDegerTipiId) {
                const degerTipi = new KodModel();
                degerTipi.id = satirCase.fixedDegerTipiId;
                group.get('degerTipiKodDto')?.setValue(degerTipi, { emitEvent: false });
            }
        }

        if (satirCase.degerTipiMode === 'hidden') {
            group.get('degerTipiKodDto')?.setValue(null, { emitEvent: false });
        }

        if (satirCase.degerTipiMode === 'selectable') {
            const degerTipiId = this.getKodId(group.get('degerTipiKodDto')?.value);
            if (degerTipiId && !satirCase.izinVerilenDegerTipiIdleri.includes(degerTipiId)) {
                group.get('degerTipiKodDto')?.setValue(null, { emitEvent: true });
            }
        }

        if (!satirCase.showOperator) {
            group.get('operatorKodDto')?.setValue(null, { emitEvent: false });
        } else {
            const operatorId = this.getKodId(group.get('operatorKodDto')?.value);
            if (operatorId && !satirCase.izinVerilenOperatorIdleri.includes(operatorId)) {
                group.get('operatorKodDto')?.setValue(null, { emitEvent: true });
            }
        }

        if (!satirCase.showDeger) {
            group.get('deger')?.setValue('', { emitEvent: false });
        }

        if (!satirCase.showDeger2) {
            group.get('deger2')?.setValue('', { emitEvent: false });
        }

        if (!satirCase.showSecenek) {
            group.get('secenekEIdDto')?.setValue(null, { emitEvent: false });
        }

        if (!satirCase.showDosyaKisitAlanlari) {
            group.get('maxDosyaBoyutuMB')?.setValue(null, { emitEvent: false });
            group.get('minDosyaSayisi')?.setValue(null, { emitEvent: false });
            group.get('maxDosyaSayisi')?.setValue(null, { emitEvent: false });
            group.get('izinVerilenDosyaTipleri')?.setValue(null, { emitEvent: false });
        }
    }

    private fillForm(rule: ResKuralV2Model): void {
        this.resetForm(rule.sira ?? this.nextRuleSira());
        this.formGroup.patchValue({
            eid: rule.eid,
            hataMesaji: rule.kuralDetay?.hataMesaji ?? '',
            isZorunlu: rule.kuralDetay?.isZorunlu ?? false,
            isAktif: rule.isAktif,
            sira: rule.sira,
        });

        for (const kosul of rule.kuralDetay?.kosullar ?? []) {
            const group = this.buildKosulGroup(kosul);
            this.kosullarArray.push(group);
            this.conditionRevealStates.push(true);
            this.subscribeKosulChanges(group);
        }

        if (this.kosullarArray.length > 0) {
            this.refreshKosulCases();
        }

        this.formGroup.markAsPristine();
    }

    private buildRuleModel(): ResKuralV2Model {
        const formValue = this.formGroup.getRawValue();
        const existingRule = this.rules.find((ruleDraft) => ruleDraft.rule.eid === formValue.eid)?.rule ?? null;
        const rule = existingRule ? cloneRule(existingRule) : new ResKuralV2Model();
        const kuralTipKodDto = rule.kuralTipKodDto ?? new KodModel();
        kuralTipKodDto.id = KURAL_TIPI_VALIDASYON;

        rule.eid = formValue.eid || this.activeRuleEid || this.buildDraftRuleEid();
        rule.formKokEIdDto = { eid: this.formKokEid } as EidModel;
        rule.formSoruKokEIdDto = { eid: this.questionKokEid } as EidModel;
        rule.kuralTipKodDto = kuralTipKodDto;
        rule.sira = formValue.sira ?? this.nextRuleSira();
        rule.isAktif = formValue.isAktif ?? true;

        const kuralDetay = new KuralV2JsonModel();
        kuralDetay.hataMesaji = formValue.hataMesaji ?? '';
        kuralDetay.isZorunlu = formValue.isZorunlu ?? false;
        kuralDetay.kosullar = ((formValue.kosullar ?? []) as KuralKosulV2Model[]).map((kosul) => ({
            ...kosul,
            soruKokEIdDto: { eid: this.questionKokEid } as EidModel,
        }));
        rule.kuralDetay = kuralDetay;

        return rule;
    }

    private nextRuleSira(): number {
        return this.visibleRules.length > 0 ? Math.max(...this.visibleRules.map((ruleDraft) => ruleDraft.rule.sira ?? 0)) + 1 : 1;
    }

    private resetForm(nextSira = 1): void {
        this.clearConditionRevealTimer();
        this.formGroup.reset({
            eid: '',
            hataMesaji: '',
            isZorunlu: false,
            isAktif: true,
            sira: nextSira,
        });

        while (this.kosullarArray.length > 0) {
            this.kosullarArray.removeAt(0);
        }

        this.kosulCases = [];
        this.conditionRevealStates = [];
    }

    private getKodId(value: { id?: number | null } | null | undefined): number {
        const id = Number(value?.id ?? 0);
        return Number.isFinite(id) ? id : 0;
    }

    private confirmDiscardCurrentRule(): boolean {
        if (!this.formGroup.dirty) {
            return true;
        }

        return window.confirm('Aktif kural uzerindeki kaydedilmemis degisiklikler silinecek. Devam etmek istiyor musunuz?');
    }

    private buildDraftRuleEid(): string {
        this.localDraftCounter += 1;
        return buildDraftRuleEid(this.questionKokEid, this.localDraftCounter);
    }

    private scheduleConditionReveal(index: number): void {
        this.clearConditionRevealTimer();
        this.conditionRevealTimer = setTimeout(() => {
            this.conditionRevealStates[index] = true;
            this.conditionRevealTimer = null;
            this.cdr.markForCheck();
        }, 16);
    }

    private clearConditionRevealTimer(): void {
        if (!this.conditionRevealTimer) {
            return;
        }

        clearTimeout(this.conditionRevealTimer);
        this.conditionRevealTimer = null;
    }
}
