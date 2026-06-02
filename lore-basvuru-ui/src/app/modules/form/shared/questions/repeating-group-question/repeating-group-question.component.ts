import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Inject,
    OnChanges,
    OnDestroy,
    OnInit,
    Optional,
    SimpleChanges,
    forwardRef,
} from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { QuestionBaseComponent } from '../question-base.component';
import { GroupInstanceSchema, QuestionSchema, QuestionTypeId } from '../../../models/form-schema.model';
import {
    DEFAULT_QUESTION_RENDER_STATE,
    QuestionRenderState,
    buildQuestionRenderState,
} from '../../models/question-render-state.model';
import { QuestionTypeRendererComponent } from '../../components/question-type-renderer/question-type-renderer.component';
import {
    RepeatingGroupShellComponent,
    RepeatingGroupShellItem,
} from '../../components/repeating-group-shell/repeating-group-shell.component';
import {
    REPEATING_GROUP_PORT,
    QuestionRenderContext,
    RepeatingGroupPort,
} from './repeating-group.port';

@Component({
    selector: 'app-repeating-group-question',
    standalone: true,
    imports: [
        CommonModule,
        RepeatingGroupShellComponent,
        forwardRef(() => QuestionTypeRendererComponent),
    ],
    templateUrl: './repeating-group-question.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepeatingGroupQuestionComponent extends QuestionBaseComponent implements OnInit, OnChanges, OnDestroy {

    dynamicShellItems$?: Observable<RepeatingGroupShellItem[]>;
    readonly defaultRenderState: QuestionRenderState = DEFAULT_QUESTION_RENDER_STATE;

    private readonly contextCache = new Map<string, QuestionRenderContext>();
    private activeSchemaEid?: string;
    private activeParentInstanceKey?: string;

    constructor(
        @Optional() @Inject(REPEATING_GROUP_PORT)
            private readonly port: RepeatingGroupPort | null,
    ) {
        super();
    }

    ngOnInit(): void {
        this.rebuildDynamicStream();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['schema'] && !changes['state']) {
            return;
        }

        const newSchemaEid = this.schema?.eid;
        const newParentKey = this.state?.groupInstanceEid;

        if (newSchemaEid !== this.activeSchemaEid || newParentKey !== this.activeParentInstanceKey) {
            this.contextCache.clear();
            this.rebuildDynamicStream();
        }
    }

    ngOnDestroy(): void {
        this.contextCache.clear();
    }

    private rebuildDynamicStream(): void {
        if (this.isAnswerOnly || !this.port) {
            return;
        }

        this.activeSchemaEid = this.schema.eid;
        this.activeParentInstanceKey = this.state.groupInstanceEid;

        this.dynamicShellItems$ = this.port
            .selectInstances$(this.schema.eid, {
                parentInstanceKey: this.state.groupInstanceEid,
            })
            .pipe(
                map(instances =>
                    instances.map(instance => ({
                        key: this.resolveInstanceKey(instance),
                        order: instance.index,
                        data: instance,
                    })),
                ),
            );
    }

    get emptyMessage(): string {
        return this.isAnswerOnly ? 'Yanıt verilmedi' : 'Henüz kayıt eklenmedi.';
    }

    get staticShellItems(): RepeatingGroupShellItem[] {
        return (this.state.groupInstances ?? []).map(instance => ({
            key: this.resolveInstanceKey(instance),
            order: instance.index,
            data: instance,
        }));
    }

    get showSchemaPreview(): boolean {
        return this.normalizedMode === 'editor';
    }

    get schemaPreviewShellItems(): RepeatingGroupShellItem[] {
        return [{ key: '__schema_preview', order: 1, data: null }];
    }

    buildSchemaPreviewChildState(child: QuestionSchema): QuestionRenderState {
        return buildQuestionRenderState({
            mode: 'editor',
            ruleState: {
                visible: true,
                disabled: true,
                required: child.required,
                readonly: true,
            },
        });
    }

    get canModify(): boolean {
        return !this.isAnswerOnly
            && !!this.port
            && !this.state.ruleState.disabled
            && !this.state.ruleState.readonly;
    }

    onAdd(): void {
        this.port?.addInstance(this.schema.eid, {
            parentInstanceKey: this.state.groupInstanceEid,
        });
    }

    onDelete(instanceKey: string): void {
        this.port?.removeInstance(instanceKey);
    }

    getChildContext(instanceKey: string, child: QuestionSchema): QuestionRenderContext | null {
        if (!this.port) {
            return null;
        }

        const cacheKey = `${instanceKey}:${child.eid}`;

        if (!this.contextCache.has(cacheKey)) {
            this.contextCache.set(
                cacheKey,
                this.port.createChildRenderContext(child.eid, instanceKey, child),
            );
        }

        return this.contextCache.get(cacheKey)!;
    }

    buildStaticChildState(instance: GroupInstanceSchema, child: QuestionSchema): QuestionRenderState {
        return buildQuestionRenderState({
            mode: 'answer-only',
            ruleState: {
                visible: true,
                disabled: false,
                required: child.required,
                readonly: true,
            },
            answer: instance.childAnswers?.[child.eid] ?? {},
            groupInstances: instance.childGroupInstances?.[child.eid] ?? [],
        });
    }

    asGroupInstance(item: RepeatingGroupShellItem): GroupInstanceSchema {
        return item.data as GroupInstanceSchema;
    }

    trackByEid(_: number, item: { eid: string }): string {
        return item.eid;
    }

    isWideQuestion(question: QuestionSchema): boolean {
        return question.questionTypeId === QuestionTypeId.TEKRARLI_GRUP
            || question.questionTypeId === QuestionTypeId.MATRIS_TEK_SECIM
            || question.questionTypeId === QuestionTypeId.MATRIS_COK_SECIM;
    }

    private resolveInstanceKey(instance: GroupInstanceSchema): string {
        return instance.eid ?? `${this.schema.eid}__group_${instance.index}`;
    }
}
