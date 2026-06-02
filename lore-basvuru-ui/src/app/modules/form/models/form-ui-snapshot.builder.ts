import { Injectable } from '@angular/core';
import { PageSchema, QuestionSchema, QuestionTypeId } from './form-schema.model';
import { GroupInstanceSnapshot, QuestionSnapshot, UserFormSavePageRequest } from './question-answer.model';
import { mapQuestionAnswerToSnapshot } from './form-ui.adapter';
import { RespondentStateStore } from '../pages/form-respondent/services/respondent-state-store.service';

@Injectable({ providedIn: 'root' })
export class FormUiSnapshotBuilder {

    buildPageSaveRequest(
        sessionEid: string,
        page: PageSchema,
        stateStore: RespondentStateStore,
    ): UserFormSavePageRequest {
        return {
            eid: sessionEid,
            sayfaKokEidDto: { eid: page.eid },
            sorular: page.questions.map((schema) => this.buildSchemaSnapshot(schema, stateStore)),
        };
    }

    private buildSchemaSnapshot(
        schema: QuestionSchema,
        stateStore: RespondentStateStore,
        groupInstanceEid?: string,
    ): QuestionSnapshot {
        if (schema.questionTypeId === QuestionTypeId.TEKRARLI_GRUP) {
            return {
                soruKokEidDto: { eid: schema.eid },
                grupInstances: this.buildGroupInstanceSnapshots(schema, stateStore, groupInstanceEid ?? null),
            };
        }

        const answer = stateStore.getAnswer(schema.eid, groupInstanceEid);
        return mapQuestionAnswerToSnapshot(schema.eid, schema.questionTypeId, answer);
    }

    private buildGroupInstanceSnapshots(
        schema: QuestionSchema,
        stateStore: RespondentStateStore,
        parentGroupInstanceEid: string | null,
    ): GroupInstanceSnapshot[] {
        return stateStore
            .getInstancesForGroup(schema.eid, parentGroupInstanceEid)
            .map((instance) => ({
                grupInstanceEidDto: this.isLocalInstance(instance.grupInstanceEid)
                    ? undefined
                    : { eid: instance.grupInstanceEid },
                sorular: schema.children.map((childSchema) =>
                    this.buildSchemaSnapshot(childSchema, stateStore, instance.grupInstanceEid),
                ),
            }));
    }

    private isLocalInstance(eid: string): boolean {
        return eid.startsWith('__local_');
    }
}
