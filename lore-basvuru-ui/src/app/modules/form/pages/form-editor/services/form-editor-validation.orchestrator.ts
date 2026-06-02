import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, map } from 'rxjs';
import { KuralEditorConfigModel, KuralV2TopluKaydetReqModel, ResKuralV2Model } from 'app/base/models/form/kuralV2';
import { EidModel } from 'app/base/models/general/eid.model';
import { KuralV2Service } from '../../kuralv2/kuralv2.service';
import { FormEditorValidationSession } from '../models/form-editor-view.model';
import { buildValidationRuleRequest, isLocalDraftRule } from './kural-v2-rule.mapper';

/**
 * Soru bazlı validasyon kurallarının sunucu senkronizasyon sekansını sahiplenir.
 *
 * Store'dan ayrıştırıldı: store yalnızca state-holder kalır (validationSession,
 * loading/saving/error patch'leri + op kaydı). Bu sınıf KuralV2 endpoint
 * orkestrasyonunu ve sıralama normalizasyonunu kapsar.
 *
 * `commitSession` backend transactional bulk endpoint'e tek çağrı yapar
 * (all-or-nothing). Kısmi hata imkânsızdır; ayrı refetch round-trip'i yoktur
 * (endpoint upsert edilen yetkili listeyi döner).
 */
@Injectable()
export class FormEditorValidationOrchestratorService {
    constructor(private readonly kuralV2Service: KuralV2Service) {}

    loadEditorConfig(): Observable<KuralEditorConfigModel> {
        return this.kuralV2Service.GetKuralEditorConfig();
    }

    loadValidationRules(soruKokEid: string): Observable<ResKuralV2Model[]> {
        return this.kuralV2Service
            .GetValidasyonBySoruKokId({ eid: soruKokEid } as EidModel)
            .pipe(map((rules) => this.normalize(rules)));
    }

    /**
     * Oturumdaki kural değişikliklerini sunucuya yazar ve yetkili (yenilenmiş,
     * sıralı) kural listesini döner. Herhangi bir adım başarısız olursa hata
     * fırlatır; çağıran dirty state'i korur.
     */
    async commitSession(session: FormEditorValidationSession): Promise<ResKuralV2Model[]> {
        const request = new KuralV2TopluKaydetReqModel();
        const formScope = session.rules
            .map((item) => item.rule.formKokEIdDto)
            .find((item) => !!item?.eid);
        request.formKokEIdDto = formScope ? { ...formScope } as EidModel : null;
        request.kurallar = session.rules
            .filter((item) => item.state !== 'deleted')
            .map((item) => buildValidationRuleRequest(item.rule));
        request.silinecekKurallar = session.rules
            .filter((item) => item.state === 'deleted' && !isLocalDraftRule(item.rule))
            .map((item) => ({ eid: item.rule.eid } as EidModel));

        const saved = await firstValueFrom(this.kuralV2Service.TopluKaydet(request));
        return this.normalize(saved);
    }

    private normalize(rules: ResKuralV2Model[] | null | undefined): ResKuralV2Model[] {
        return (rules ?? []).slice().sort((left, right) => (left.sira ?? 0) - (right.sira ?? 0));
    }
}
