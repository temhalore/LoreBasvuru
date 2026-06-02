import { FormDto } from '../../../models';
import { FormEditorGroupWorkspaceItem } from '../models/form-editor-view.model';
import { resolveStackForSelection, validateWorkspaceStack } from './workspace-stack.util';

function form(): FormDto {
    return {
        eid: 'form-1',
        sayfalar: [
            {
                eid: 'page-1',
                sorular: [
                    { eid: 'g1', altSorular: [{ eid: 'g1-1', altSorular: [] }] },
                    { eid: 'q1', altSorular: [] },
                ],
            },
        ],
    } as unknown as FormDto;
}

describe('workspace-stack.util', () => {
    const stack: FormEditorGroupWorkspaceItem[] = [{ containerEid: 'g1' }];

    it('resolveStackForSelection boş yığını olduğu gibi döner', () => {
        expect(resolveStackForSelection(form(), [], 'q1')).toEqual([]);
    });

    it('resolveStackForSelection container içindeki seçimde yığını korur', () => {
        expect(resolveStackForSelection(form(), stack, 'g1-1')).toEqual([{ containerEid: 'g1' }]);
        expect(resolveStackForSelection(form(), stack, 'g1')).toEqual([{ containerEid: 'g1' }]);
    });

    it('resolveStackForSelection yığın dışı seçimde yığını boşaltır', () => {
        expect(resolveStackForSelection(form(), stack, 'q1')).toEqual([]);
    });

    it('validateWorkspaceStack geçersiz container’dan itibaren kırpar', () => {
        expect(validateWorkspaceStack(form(), stack)).toEqual([{ containerEid: 'g1' }]);
        expect(validateWorkspaceStack(form(), [{ containerEid: 'missing' }])).toEqual([]);
        expect(validateWorkspaceStack(form(), [{ containerEid: 'g1' }, { containerEid: 'gone' }]))
            .toEqual([{ containerEid: 'g1' }]);
    });
});
