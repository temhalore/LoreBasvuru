import { defaultTab, findTab, getLauncherTabs, getTabs } from './form-editor-panel.config';

describe('form-editor-panel.config', () => {
    it('returns visible tabs per side', () => {
        expect(getTabs('left').map((tab) => tab.id)).toEqual(['structure']);
        expect(getTabs('right').map((tab) => tab.id)).toEqual(['add', 'library', 'conditions', 'diagnostics']);
    });

    it('returns launcher tabs from the unified registry', () => {
        expect(getLauncherTabs().map((tab) => tab.id)).toEqual(['structure', 'add', 'library', 'conditions', 'diagnostics']);
        expect(getLauncherTabs('right').map((tab) => tab.id)).toEqual(['add', 'library', 'conditions', 'diagnostics']);
    });

    it('resolves defaults by side', () => {
        expect(defaultTab('left')).toBe('structure');
        expect(defaultTab('right')).toBe('add');
    });

    it('finds tabs by id', () => {
        expect(findTab('structure')?.side).toBe('left');
        expect(findTab('diagnostics')?.side).toBe('right');
        expect(findTab('effects')?.placeholder).toContain('bagimlilik');
    });
});
