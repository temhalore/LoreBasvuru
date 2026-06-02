import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { KuralV2TopluKaydetReqModel, ResKuralV2Model } from 'app/base/models/form/kuralV2';
import { FormEditorValidationSession } from '../models/form-editor-view.model';
import { FormEditorValidationOrchestratorService } from './form-editor-validation.orchestrator';
import { KuralV2Service } from '../../kuralv2/kuralv2.service';

describe('FormEditorValidationOrchestratorService', () => {
    let orchestrator: FormEditorValidationOrchestratorService;
    let kuralV2: jasmine.SpyObj<KuralV2Service>;

    beforeEach(() => {
        kuralV2 = jasmine.createSpyObj<KuralV2Service>('KuralV2Service', [
            'GetKuralEditorConfig',
            'GetValidasyonBySoruKokId',
            'TopluKaydet',
            'AddDirect',
            'SetDirect',
            'DelDirect',
        ]);
        TestBed.configureTestingModule({
            providers: [
                FormEditorValidationOrchestratorService,
                { provide: KuralV2Service, useValue: kuralV2 },
            ],
        });
        orchestrator = TestBed.inject(FormEditorValidationOrchestratorService);
    });

    function rule(eid: string, sira: number): ResKuralV2Model {
        return {
            eid,
            sira,
            isAktif: true,
            formKokEIdDto: { eid: 'form-root-1' },
            kuralDetay: { kosullar: [] },
        } as ResKuralV2Model;
    }

    it('commitSession tek TopluKaydet çağrısı yapar; Add/Set/Del çağırmaz', async () => {
        const session: FormEditorValidationSession = {
            questionEid: 'soru-1',
            activeRuleEid: null,
            isDirty: true,
            rules: [
                { rule: rule('', 1), state: 'new' },
                { rule: rule('rule-2', 2), state: 'existing' },
                { rule: rule('rule-3', 3), state: 'deleted' },
                { rule: rule('draft-soru-1-1', 4), state: 'deleted' },
            ],
        };
        kuralV2.TopluKaydet.and.returnValue(of([rule('rule-2', 2), rule('rule-9', 1)]));

        const result = await orchestrator.commitSession(session);

        expect(kuralV2.TopluKaydet).toHaveBeenCalledTimes(1);
        expect(kuralV2.AddDirect).not.toHaveBeenCalled();
        expect(kuralV2.SetDirect).not.toHaveBeenCalled();
        expect(kuralV2.DelDirect).not.toHaveBeenCalled();
        expect(kuralV2.GetValidasyonBySoruKokId).not.toHaveBeenCalled();

        const req = kuralV2.TopluKaydet.calls.mostRecent().args[0] as KuralV2TopluKaydetReqModel;
        // 3 aktif (new + existing + ... ) upsert, deleted'lar hariç
        expect(req.kurallar.length).toBe(2);
        expect(req.formKokEIdDto?.eid).toBe('form-root-1');
        // Yerel taslak (draft-) silme listesine girmez; yalnız persist edilmiş silinen
        expect(req.silinecekKurallar.map((e) => e.eid)).toEqual(['rule-3']);
        // Dönüş sira'ya göre normalize
        expect(result.map((r) => r.eid)).toEqual(['rule-9', 'rule-2']);
    });
});
