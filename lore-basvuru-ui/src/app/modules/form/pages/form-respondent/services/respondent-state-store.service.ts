import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import {
    UserFormAnswer,
    UserFormState,
    FormDosyaRef,
    UserFormPageState,
    UserFormQuestionState,
} from '../models/form-respondent-canonical-state.model';
import { QuestionAnswerModel, UserFormIssue } from '../../../models/question-answer.model';
import { normalizeDateOnlyValue } from '../../../models/form-ui.adapter';

export interface StoreGroupInstance {
    grupInstanceEid: string;
    grupSoruKokEid: string;
    ustStoreGroupInstanceEid: string | null;
    sira: number;
}

export interface QuestionHostState {
    answer: QuestionAnswerModel | undefined;
    dependencyAnswers: ReadonlyMap<string, QuestionAnswerModel>;
}

/**
 * UserForm state store.
 * UserForm tree state ile hydrate/merge yapar, internal olarak flat map'ler tutar.
 * Tüm key'ler eid (şifreli string) kullanır.
 */
@Injectable()
export class RespondentStateStore {

    // ── Internal state ──────────────────────────────────
    private topAnswersSubject = new BehaviorSubject<Map<string, QuestionAnswerModel>>(new Map());
    private grupAnswersSubject = new BehaviorSubject<Map<string, QuestionAnswerModel>>(new Map());
    private instancesSubject = new BehaviorSubject<StoreGroupInstance[]>([]);
    private issuesSubject = new BehaviorSubject<UserFormIssue[]>([]);
    private saveRequestsSubject = new Subject<void>();

    // ── Dirty tracking ──────────────────────────────────
    private dirtyTopKeys = new Set<string>();
    private dirtyGrupKeys = new Set<string>();
    private structureDirty = false;

    // ── Local instance management ───────────────────────
    private localInstanceCounter = 0;
    private localInstanceEids = new Set<string>();
    private baselineStructureSignature = '';

    // ── Public observables ──────────────────────────────
    /** Top-level answers — rule engine subscription için */
    topAnswers$ = this.topAnswersSubject.asObservable();
    instances$ = this.instancesSubject.asObservable();
    saveRequests$ = this.saveRequestsSubject.asObservable();

    // ════════════════════════════════════════════
    // HYDRATE & MERGE (user form tree ↔ flat maps)
    // ════════════════════════════════════════════

    /**
    * Session başlangıcında user form state ağacından tüm state'i yükler.
     */
    hydrateFromCanonical(formState: UserFormState): void {
        const topAnswers = new Map<string, QuestionAnswerModel>();
        const grupAnswers = new Map<string, QuestionAnswerModel>();
        const instances: StoreGroupInstance[] = [];

        for (const page of formState.sayfalar) {
            for (const qs of page.sorular) {
                this.walkQuestionState(qs, null, topAnswers, grupAnswers, instances);
            }
        }

        this.topAnswersSubject.next(topAnswers);
        this.grupAnswersSubject.next(grupAnswers);
        this.instancesSubject.next(instances);
        this.issuesSubject.next([]);
        this.resetDirtyState();
    }

    /**
     * Sayfa/Kaydet response'undan gelen authoritative page state'ini merge eder.
     * Sayfadaki tüm cevap ve instance'ları sunucu verileriyle değiştirir.
     */
    mergePageState(pageState: UserFormPageState): void {
        const topAnswers = new Map(this.topAnswersSubject.value);
        const grupAnswers = new Map(this.grupAnswersSubject.value);
        let instances = [...this.instancesSubject.value];

        // Eski state'i temizle
        for (const qs of pageState.sorular) {
            const soruEid = qs.soruKokEidDto.eid;
            if (qs.grupInstances) {
                const eidsToRemove = this.collectInstanceEidsForGroup(soruEid, null, instances);
                for (const key of grupAnswers.keys()) {
                    const gEid = key.split(':')[0];
                    if (eidsToRemove.has(gEid)) grupAnswers.delete(key);
                }
                instances = instances.filter(i => !eidsToRemove.has(i.grupInstanceEid));
                for (const eid of eidsToRemove) this.localInstanceEids.delete(eid);
            } else {
                topAnswers.delete(soruEid);
            }
        }

        // UserForm tree'den yeniden yükle
        for (const qs of pageState.sorular) {
            this.walkQuestionState(qs, null, topAnswers, grupAnswers, instances);
        }

        this.topAnswersSubject.next(topAnswers);
        this.grupAnswersSubject.next(grupAnswers);
        this.instancesSubject.next(instances);
        this.resetDirtyState();
    }

    private walkQuestionState(
        qs: UserFormQuestionState,
        grupInstanceEid: string | null,
        topAnswers: Map<string, QuestionAnswerModel>,
        grupAnswers: Map<string, QuestionAnswerModel>,
        instances: StoreGroupInstance[],
    ): void {
        const soruEid = qs.soruKokEidDto.eid;
        if (qs.grupInstances?.length) {
            for (const gi of qs.grupInstances) {
                const giEid = gi.grupInstanceEidDto?.eid ?? '';
                instances.push({
                    grupInstanceEid: giEid,
                    grupSoruKokEid: soruEid,
                    ustStoreGroupInstanceEid: grupInstanceEid,
                    sira: gi.sira,
                });
                for (const childQs of gi.sorular) {
                    this.walkQuestionState(childQs, giEid, topAnswers, grupAnswers, instances);
                }
            }
        } else if (qs.answer) {
            const av = this.mapUserFormAnswerToQuestionAnswer(qs.answer);
            if (grupInstanceEid != null) {
                grupAnswers.set(this.makeKey(grupInstanceEid, soruEid), av);
            } else {
                topAnswers.set(soruEid, av);
            }
        }
    }

    private collectInstanceEidsForGroup(
        grupSoruKokEid: string,
        ustStoreGroupInstanceEid: string | null,
        instances: StoreGroupInstance[],
    ): Set<string> {
        const result = new Set<string>();
        const direct = instances.filter(i =>
            i.grupSoruKokEid === grupSoruKokEid &&
            i.ustStoreGroupInstanceEid === (ustStoreGroupInstanceEid ?? null),
        );
        for (const inst of direct) {
            result.add(inst.grupInstanceEid);
            const children = instances.filter(i => i.ustStoreGroupInstanceEid === inst.grupInstanceEid);
            const childGroupEids = [...new Set(children.map(i => i.grupSoruKokEid))];
            for (const childGSE of childGroupEids) {
                for (const eid of this.collectInstanceEidsForGroup(childGSE, inst.grupInstanceEid, instances)) {
                    result.add(eid);
                }
            }
        }
        return result;
    }

    // ════════════════════════════════════════════
    // ANSWER ACCESS (unified API)
    // ════════════════════════════════════════════

    selectAnswer(soruKokEid: string, grupInstanceEid?: string): Observable<QuestionAnswerModel | undefined> {
        if (grupInstanceEid != null) {
            const key = this.makeKey(grupInstanceEid, soruKokEid);
            return this.grupAnswersSubject.pipe(
                map(m => m.get(key)),
                distinctUntilChanged(),
            );
        }
        return this.topAnswersSubject.pipe(
            map(m => m.get(soruKokEid)),
            distinctUntilChanged(),
        );
    }

    selectTopLevelAnswers(questionEids: readonly string[]): Observable<ReadonlyMap<string, QuestionAnswerModel>> {
        const normalizedEids = [...new Set(questionEids)].sort();

        return this.topAnswersSubject.pipe(
            map(answerMap => {
                const selectedAnswers = new Map<string, QuestionAnswerModel>();

                for (const questionEid of normalizedEids) {
                    const answer = answerMap.get(questionEid);
                    if (answer !== undefined) {
                        selectedAnswers.set(questionEid, answer);
                    }
                }

                return selectedAnswers;
            }),
            distinctUntilChanged((prev, next) => this.areAnswerMapsEqual(prev, next)),
        );
    }

    selectQuestionHostState(
        soruKokEid: string,
        dependencyQuestionEids: readonly string[],
        grupInstanceEid?: string,
    ): Observable<QuestionHostState> {
        return combineLatest([
            this.selectAnswer(soruKokEid, grupInstanceEid),
            this.selectTopLevelAnswers(dependencyQuestionEids),
        ]).pipe(
            map(([answer, dependencyAnswers]) => ({
                answer,
                dependencyAnswers,
            })),
            distinctUntilChanged((prev, next) =>
                this.areAnswerValuesEqual(prev.answer, next.answer) &&
                this.areAnswerMapsEqual(prev.dependencyAnswers, next.dependencyAnswers),
            ),
        );
    }

    selectIssuesForQuestion(soruKokEid: string, grupInstanceEid?: string): Observable<UserFormIssue[]> {
        return this.issuesSubject.pipe(
            map((issues) => issues.filter((issue) => this.issueTargetsQuestion(issue, soruKokEid, grupInstanceEid))),
            distinctUntilChanged((prev, next) => JSON.stringify(prev) === JSON.stringify(next)),
        );
    }

    setIssues(issues: UserFormIssue[] | null | undefined): void {
        this.issuesSubject.next(issues ?? []);
    }

    getAnswer(soruKokEid: string, grupInstanceEid?: string): QuestionAnswerModel | undefined {
        if (grupInstanceEid != null) {
            return this.grupAnswersSubject.value.get(this.makeKey(grupInstanceEid, soruKokEid));
        }
        return this.topAnswersSubject.value.get(soruKokEid);
    }

    setAnswer(soruKokEid: string, value: QuestionAnswerModel, grupInstanceEid?: string): void {
        if (grupInstanceEid != null) {
            const key = this.makeKey(grupInstanceEid, soruKokEid);
            const current = new Map(this.grupAnswersSubject.value);
            current.set(key, value);
            this.grupAnswersSubject.next(current);
            this.dirtyGrupKeys.add(key);
            this.requestSave();
        } else {
            const current = new Map(this.topAnswersSubject.value);
            current.set(soruKokEid, value);
            this.topAnswersSubject.next(current);
            this.dirtyTopKeys.add(soruKokEid);
            this.requestSave();
        }
    }

    getTopAnswersSnapshot(): Map<string, QuestionAnswerModel> {
        return new Map(this.topAnswersSubject.value);
    }

    // ════════════════════════════════════════════
    // INSTANCE MANAGEMENT
    // ════════════════════════════════════════════

    selectInstancesForGroup(
        grupSoruKokEid: string,
        ustStoreGroupInstanceEid?: string | null,
    ): Observable<StoreGroupInstance[]> {
        return this.instances$.pipe(
            map(instances =>
                instances
                    .filter(i =>
                        i.grupSoruKokEid === grupSoruKokEid &&
                        i.ustStoreGroupInstanceEid === (ustStoreGroupInstanceEid ?? null),
                    )
                    .sort((a, b) => a.sira - b.sira),
            ),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        );
    }

    getInstancesForGroup(
        grupSoruKokEid: string,
        ustStoreGroupInstanceEid?: string | null,
    ): StoreGroupInstance[] {
        return this.instancesSubject.value
            .filter(i =>
                i.grupSoruKokEid === grupSoruKokEid &&
                i.ustStoreGroupInstanceEid === (ustStoreGroupInstanceEid ?? null),
            )
            .sort((a, b) => a.sira - b.sira);
    }

    addLocalInstance(grupSoruKokEid: string, ustStoreGroupInstanceEid?: string): StoreGroupInstance {
        const tempEid = `__local_${++this.localInstanceCounter}`;
        const existing = this.getInstancesForGroup(grupSoruKokEid, ustStoreGroupInstanceEid ?? null);
        const sira = existing.length > 0 ? Math.max(...existing.map(i => i.sira)) + 1 : 1;

        const instance: StoreGroupInstance = {
            grupInstanceEid: tempEid,
            grupSoruKokEid,
            ustStoreGroupInstanceEid: ustStoreGroupInstanceEid ?? null,
            sira,
        };

        this.localInstanceEids.add(tempEid);
        const nextInstances = [...this.instancesSubject.value, instance];
        this.instancesSubject.next(nextInstances);
        this.refreshStructureDirty(nextInstances);
        this.requestSave();

        return instance;
    }

    removeInstance(grupInstanceEid: string): void {
        const descendantEids = this.getDescendantInstanceEids(grupInstanceEid);
        const allRemovedEids = new Set([grupInstanceEid, ...descendantEids]);

        for (const eid of allRemovedEids) {
            this.localInstanceEids.delete(eid);
        }

        const remaining = this.instancesSubject.value.filter(
            i => !allRemovedEids.has(i.grupInstanceEid),
        );
        this.instancesSubject.next(remaining);
        this.refreshStructureDirty(remaining);

        const answerMap = new Map(this.grupAnswersSubject.value);
        for (const key of answerMap.keys()) {
            const gEid = key.split(':')[0];
            if (allRemovedEids.has(gEid)) {
                answerMap.delete(key);
                this.dirtyGrupKeys.delete(key);
            }
        }
        this.grupAnswersSubject.next(answerMap);
        this.requestSave();
    }

    private getDescendantInstanceEids(parentEid: string): string[] {
        const result: string[] = [];
        const children = this.instancesSubject.value.filter(
            i => i.ustStoreGroupInstanceEid === parentEid,
        );
        for (const child of children) {
            result.push(child.grupInstanceEid);
            result.push(...this.getDescendantInstanceEids(child.grupInstanceEid));
        }
        return result;
    }

    // ════════════════════════════════════════════
    // DIRTY TRACKING
    // ════════════════════════════════════════════

    hasDirtyAnswers(): boolean {
        return this.dirtyTopKeys.size > 0 || this.dirtyGrupKeys.size > 0 || this.structureDirty;
    }

    clearDirty(): void {
        this.dirtyTopKeys.clear();
        this.dirtyGrupKeys.clear();
        this.baselineStructureSignature = this.buildStructureSignature(this.instancesSubject.value);
        this.structureDirty = false;
    }

    // ════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════

    private makeKey(grupInstanceEid: string, soruKokEid: string): string {
        return `${grupInstanceEid}:${soruKokEid}`;
    }

    private issueTargetsQuestion(issue: UserFormIssue, soruKokEid: string, grupInstanceEid?: string): boolean {
        if (issue.targetType !== 'Soru') {
            return false;
        }

        const questionMatches = issue.targetEid === soruKokEid || issue.targetKey === soruKokEid;
        if (!questionMatches) {
            return false;
        }

        if (grupInstanceEid != null) {
            return issue.targetGroupInstanceEid === grupInstanceEid;
        }

        return !issue.targetGroupInstanceEid;
    }

    private requestSave(): void {
        this.saveRequestsSubject.next();
    }

    private mapUserFormAnswerToQuestionAnswer(answer: UserFormAnswer): QuestionAnswerModel {
        return {
            textValue: answer.cevapMetni,
            numericValue: answer.cevapSayi,
            dateValue: normalizeDateOnlyValue(answer.cevapTarih),
            rawDateValue: answer.cevapTarih,
            booleanValue: answer.cevapMantiksal,
            singleOptionEid: answer.secenekKokEidDto?.eid,
            extraText: answer.ekAciklama,
            multiOptionEids: answer.secilenSecenekKokEidDtoler?.map(e => e.eid),
            matrixAnswers: answer.matrisCevaplar?.map(r => ({
                rowEid: r.matrisSatirKokEidDto.eid,
                singleColumnEid: r.matrisSutunKokEidDto?.eid,
                multiColumnEids: r.secilenSutunKokEidDtoler?.map(e => e.eid) ?? [],
            })),
            files: answer.dosyalar?.map((d: FormDosyaRef) => ({
                eid: d.eid ?? '',
                label: d.dosyaAd ?? d.dosyaDto?.dosyaAd ?? '',
                extension: d.uzanti ?? d.dosyaDto?.uzanti ?? '',
                size: d.boyut ?? d.dosyaDto?.boyut ?? 0,
                url: d.url ?? d.dosyaDto?.minIo_url ?? '',
            })),
        };
    }

    private resetDirtyState(): void {
        this.dirtyTopKeys.clear();
        this.dirtyGrupKeys.clear();
        this.baselineStructureSignature = this.buildStructureSignature(this.instancesSubject.value);
        this.structureDirty = false;
        this.localInstanceEids.clear();
        this.localInstanceCounter = 0;
    }

    private refreshStructureDirty(instances: StoreGroupInstance[]): void {
        this.structureDirty = this.buildStructureSignature(instances) !== this.baselineStructureSignature;
    }

    private buildStructureSignature(instances: StoreGroupInstance[]): string {
        return instances
            .map(instance => `${instance.grupInstanceEid}|${instance.grupSoruKokEid}|${instance.ustStoreGroupInstanceEid ?? ''}|${instance.sira}`)
            .sort()
            .join('||');
    }

    private areAnswerMapsEqual(
        left: ReadonlyMap<string, QuestionAnswerModel>,
        right: ReadonlyMap<string, QuestionAnswerModel>,
    ): boolean {
        if (left.size !== right.size) {
            return false;
        }

        for (const [key, leftValue] of left.entries()) {
            const rightValue = right.get(key);
            if (!this.areAnswerValuesEqual(leftValue, rightValue)) {
                return false;
            }
        }

        return true;
    }

    private areAnswerValuesEqual(
        left: QuestionAnswerModel | undefined,
        right: QuestionAnswerModel | undefined,
    ): boolean {
        if (left === right) {
            return true;
        }

        if (left == null || right == null) {
            return false;
        }

        return JSON.stringify(left) === JSON.stringify(right);
    }
}
