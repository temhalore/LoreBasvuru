import { Injectable } from '@angular/core';
import { PageSchema } from '../../models/form-schema.model';

@Injectable()
export class QuestionPreviewRuleEngineService {
    applyPage(page: PageSchema | null): PageSchema | null {
        return page;
    }
}
