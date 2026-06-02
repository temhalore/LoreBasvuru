import { QuestionDto } from '../../../../../models';
import { applyQuestionEditorFormValue, buildQuestionEditorForm } from './question-editor-form.factory';

describe('question-editor-form.factory', () => {
    it('maps a single other option with explanation metadata', () => {
        const question = {
            eid: 'question-1',
            soruMetni: 'Question',
            secenekler: [
                {
                    eid: 'option-1',
                    secenekMetni: 'Normal',
                    secenekDegeri: 'normal',
                    sira: 1,
                    isDiger: false,
                    isAciklamaIsteniyor: false,
                    isAciklamaZorunlu: false,
                },
                {
                    eid: 'option-other',
                    secenekMetni: 'Diger',
                    secenekDegeri: 'other',
                    sira: 2,
                    isDiger: true,
                    isAciklamaIsteniyor: true,
                    isAciklamaZorunlu: true,
                },
            ],
        } as QuestionDto;

        const form = buildQuestionEditorForm(question);
        const result = applyQuestionEditorFormValue(question, form);

        expect(result.secenekler?.filter((option) => option.isDiger).length).toBe(1);
        expect(result.secenekler?.[1].isAciklamaIsteniyor).toBeTrue();
        expect(result.secenekler?.[1].isAciklamaZorunlu).toBeTrue();
        expect(result.secenekler?.[1].sira).toBe(2);
    });
});
