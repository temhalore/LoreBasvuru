import { KuralEditorConfigModel } from 'app/base/models/form/kuralV2';
import { getSoruTipValidationSupportState, isSoruTipValidationSupported } from './kural-v2-editor.utils';

describe('kural-v2-editor.utils', () => {
    it('returns unsupported message from config when validation is disabled', () => {
        const config: KuralEditorConfigModel = {
            items: [
                {
                    soruTipId: 1050015,
                    supportsValidation: false,
                    unsupportedMessage: 'Bu soru tipinde validasyon desteklenmez.',
                    kosulTipleri: [],
                },
            ],
        };

        const state = getSoruTipValidationSupportState(config, 1050015);

        expect(state.supported).toBeFalse();
        expect(state.unsupportedMessage).toBe('Bu soru tipinde validasyon desteklenmez.');
        expect(isSoruTipValidationSupported(config, 1050015)).toBeFalse();
    });

    it('fails closed for unknown question types', () => {
        const config: KuralEditorConfigModel = { items: [] };

        const state = getSoruTipValidationSupportState(config, 9999999);

        expect(state.supported).toBeFalse();
        expect(state.unsupportedMessage).toBe('Bu soru tipi icin validasyon tanimlanamaz.');
        expect(state.config).toBeNull();
        expect(isSoruTipValidationSupported(config, 9999999)).toBeFalse();
    });
});
