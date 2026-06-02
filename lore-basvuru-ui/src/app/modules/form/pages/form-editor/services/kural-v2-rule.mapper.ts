import { KodModel } from 'app/base/models/common/kod.model';
import { KuralV2JsonModel, ReqKuralV2Model, ResKuralV2Model } from 'app/base/models/form/kuralV2';
import { KURAL_TIPI_VALIDASYON } from 'app/modules/form/shared/rule-v2/kural-v2-editor.utils';
import { FormEditorValidationRuleDraft } from '../models/form-editor-view.model';

/**
 * KuralV2 kural modeli için TEK dönüşüm/klon kaynağı.
 *
 * Önceden bu mantık iki yerde ayrı duruyordu: store
 * (`buildValidationRuleRequest`/`isLocalDraftRule`) ve validation editor outlet
 * (`cloneRule`/`cloneRuleDrafts`/local draft prefix bilgisi). İki kopyanın
 * birbirinden kayma riskini ortadan kaldırmak için tek modülde toplandı (M3).
 */

export const LOCAL_DRAFT_RULE_PREFIX = 'draft-';

/** Henüz sunucuya yazılmamış, yalnızca client'ta var olan taslak kural mı? */
export function isLocalDraftRule(rule: ResKuralV2Model): boolean {
    return (rule.eid ?? '').startsWith(LOCAL_DRAFT_RULE_PREFIX);
}

/** Yerel taslak kural için benzersiz geçici eid üretir. */
export function buildDraftRuleEid(questionKokEid: string, counter: number): string {
    return `${LOCAL_DRAFT_RULE_PREFIX}${questionKokEid || 'rule'}-${counter}`;
}

/** Bir kural taslağını sunucu kayıt isteğine (ReqKuralV2Model) dönüştürür. */
export function buildValidationRuleRequest(rule: ResKuralV2Model): ReqKuralV2Model {
    const request = new ReqKuralV2Model();
    const kuralTipKodDto = rule.kuralTipKodDto ?? new KodModel();
    kuralTipKodDto.id = kuralTipKodDto.id || KURAL_TIPI_VALIDASYON;

    request.eid = isLocalDraftRule(rule) ? '' : rule.eid;
    request.formKokEIdDto = rule.formKokEIdDto ?? null;
    request.formSoruKokEIdDto = rule.formSoruKokEIdDto ?? null;
    request.kuralTipKodDto = kuralTipKodDto;
    request.sira = rule.sira ?? 0;
    request.isAktif = rule.isAktif ?? true;

    const detail = new KuralV2JsonModel();
    detail.hataMesaji = rule.kuralDetay?.hataMesaji ?? '';
    detail.isZorunlu = rule.kuralDetay?.isZorunlu ?? false;
    detail.hedefSayfaEIdDto = rule.kuralDetay?.hedefSayfaEIdDto ?? null;
    detail.hedefSoruKokEIdDto = rule.kuralDetay?.hedefSoruKokEIdDto ?? null;
    detail.kosullar = (rule.kuralDetay?.kosullar ?? []).map((kosul) => ({
        ...kosul,
        soruKokEIdDto: kosul.soruKokEIdDto ?? rule.formSoruKokEIdDto ?? null,
    }));
    request.kuralDetay = detail;

    return request;
}

/** ResKuralV2Model'i iç içe referansları kopyalayarak derin klonlar. */
export function cloneRule(rule: ResKuralV2Model): ResKuralV2Model {
    return {
        ...rule,
        formKokEIdDto: rule.formKokEIdDto ? { ...rule.formKokEIdDto } : null,
        formSoruKokEIdDto: rule.formSoruKokEIdDto ? { ...rule.formSoruKokEIdDto } : null,
        kuralTipKodDto: rule.kuralTipKodDto ? { ...rule.kuralTipKodDto } : null,
        kuralDetay: rule.kuralDetay
            ? {
                ...rule.kuralDetay,
                hedefSayfaEIdDto: rule.kuralDetay.hedefSayfaEIdDto ? { ...rule.kuralDetay.hedefSayfaEIdDto } : null,
                hedefSoruKokEIdDto: rule.kuralDetay.hedefSoruKokEIdDto ? { ...rule.kuralDetay.hedefSoruKokEIdDto } : null,
                kosullar: (rule.kuralDetay.kosullar ?? []).map((kosul) => ({
                    ...kosul,
                    kosulTipKodDto: kosul.kosulTipKodDto ? { ...kosul.kosulTipKodDto } : null,
                    soruKokEIdDto: kosul.soruKokEIdDto ? { ...kosul.soruKokEIdDto } : null,
                    secenekEIdDto: kosul.secenekEIdDto ? { ...kosul.secenekEIdDto } : null,
                    matrisSatirEIdDto: kosul.matrisSatirEIdDto ? { ...kosul.matrisSatirEIdDto } : null,
                    matrisSutunEIdDto: kosul.matrisSutunEIdDto ? { ...kosul.matrisSutunEIdDto } : null,
                    operatorKodDto: kosul.operatorKodDto ? { ...kosul.operatorKodDto } : null,
                    degerTipiKodDto: kosul.degerTipiKodDto ? { ...kosul.degerTipiKodDto } : null,
                    joinKodDto: kosul.joinKodDto ? { ...kosul.joinKodDto } : null,
                    izinVerilenDosyaTipleri: kosul.izinVerilenDosyaTipleri?.map((dosyaTipi) => ({ ...dosyaTipi })) ?? null,
                })),
            }
            : null,
    } as ResKuralV2Model;
}

/** Kural taslağı listesini durumlarını koruyarak derin klonlar. */
export function cloneRuleDrafts(rules: FormEditorValidationRuleDraft[]): FormEditorValidationRuleDraft[] {
    return rules.map((ruleDraft) => ({
        state: ruleDraft.state,
        rule: cloneRule(ruleDraft.rule),
    }));
}
