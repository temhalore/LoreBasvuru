import { FormDto } from '../../../models';
import { FormEditorGroupWorkspaceItem } from '../models/form-editor-view.model';
import { collectContainerEids, findContainerChildren } from './form-tree.util';

/**
 * Grup workspace yığını için saf yardımcılar (store'dan ayrıştırıldı).
 */

/**
 * Bir node seçildiğinde workspace yığınını, seçili node'u içeren en derin
 * container'a kadar daraltır; yığında değilse boşaltır.
 */
export function resolveStackForSelection(
    form: FormDto | null,
    stack: FormEditorGroupWorkspaceItem[],
    selectedEid: string,
): FormEditorGroupWorkspaceItem[] {
    if (!stack.length) {
        return stack;
    }

    for (let i = stack.length - 1; i >= 0; i -= 1) {
        const container = stack[i];
        if (container.containerEid === selectedEid) {
            return stack.slice(0, i + 1);
        }

        const children = findContainerChildren(form, container.containerEid) ?? [];
        if (children.some((child) => child.eid === selectedEid)) {
            return stack.slice(0, i + 1);
        }
    }

    return [];
}

/**
 * Form değiştiğinde geçersiz kalan (artık var olmayan container) yığın
 * elemanlarından itibaren yığını kırpar.
 */
export function validateWorkspaceStack(
    form: FormDto | null,
    stack: FormEditorGroupWorkspaceItem[],
): FormEditorGroupWorkspaceItem[] {
    if (!stack.length) {
        return stack;
    }

    const validEids = collectContainerEids(form);
    let cutoff = stack.length;
    for (let i = 0; i < stack.length; i += 1) {
        if (!validEids.has(stack[i].containerEid)) {
            cutoff = i;
            break;
        }
    }

    return cutoff === stack.length ? stack : stack.slice(0, cutoff);
}
