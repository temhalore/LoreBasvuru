import { ResKuralV2Model } from 'app/base/models/form/kuralV2';
import { KURAL_TIPI_VALIDASYON } from 'app/modules/form/shared/rule-v2/kural-v2-editor.utils';
import {
    buildDraftRuleEid,
    buildValidationRuleRequest,
    cloneRule,
    isLocalDraftRule,
} from './kural-v2-rule.mapper';

function rule(overrides: Partial<ResKuralV2Model> = {}): ResKuralV2Model {
    return {
        eid: 'rule-1',
        sira: 3,
        isAktif: true,
        formKokEIdDto: { eid: 'form-root' },
        formSoruKokEIdDto: { eid: 'soru-root' },
        kuralTipKodDto: null,
        kuralDetay: {
            hataMesaji: 'mesaj',
            isZorunlu: true,
            hedefSayfaEIdDto: null,
            hedefSoruKokEIdDto: null,
            kosullar: [{ soruKokEIdDto: null, kosulTipKodDto: { id: 1 } } as never],
        },
        ...overrides,
    } as ResKuralV2Model;
}

describe('kural-v2-rule.mapper', () => {
    it('isLocalDraftRule yalnızca draft- önekli eid için true', () => {
        expect(isLocalDraftRule(rule({ eid: 'draft-soru-1' }))).toBeTrue();
        expect(isLocalDraftRule(rule({ eid: 'rule-1' }))).toBeFalse();
        expect(isLocalDraftRule(rule({ eid: '' }))).toBeFalse();
    });

    it('buildDraftRuleEid tutarlı önek üretir, eid yoksa "rule" kullanır', () => {
        expect(buildDraftRuleEid('soru-9', 2)).toBe('draft-soru-9-2');
        expect(buildDraftRuleEid('', 1)).toBe('draft-rule-1');
    });

    it('buildValidationRuleRequest yerel taslakta eid boşaltır ve kural tipini garanti eder', () => {
        const req = buildValidationRuleRequest(rule({ eid: 'draft-x-1' }));
        expect(req.eid).toBe('');
        expect(req.kuralTipKodDto?.id).toBe(KURAL_TIPI_VALIDASYON);
        expect(req.sira).toBe(3);
    });

    it('buildValidationRuleRequest koşul soruKokEIdDto boşsa formSoruKokEIdDto ile doldurur', () => {
        const req = buildValidationRuleRequest(rule());
        expect(req.kuralDetay?.kosullar?.[0].soruKokEIdDto).toEqual({ eid: 'soru-root' });
    });

    it('cloneRule derin kopyalar; klon mutasyonu kaynağı etkilemez', () => {
        const source = rule();
        const clone = cloneRule(source);
        clone.formKokEIdDto!.eid = 'changed';
        clone.kuralDetay!.kosullar![0].kosulTipKodDto = { id: 99 } as never;

        expect(source.formKokEIdDto!.eid).toBe('form-root');
        expect((source.kuralDetay!.kosullar![0].kosulTipKodDto as { id: number }).id).toBe(1);
    });
});
