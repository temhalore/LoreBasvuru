import { KodModel } from 'app/base/models/common/kod.model';

export const FORM_ITEM_TIP = {
    SAYFA: 2120001,
    SORU: 2120002,
} as const;

export interface FormPaletteItemDto {
    formItemTipKodDto: KodModel;
    soruTipKodDto?: KodModel | null;
    title: string;
    description: string;
    category: string;
    subCategory?: string | null;
    sira: number;
    isAktif: boolean;
    icon: string;
}

export interface FormPaletteGroup {
    key: string;
    title: string;
    order: number;
    items: FormPaletteItemDto[];
    subGroups?: FormPaletteGroup[];
}

const CATEGORY_META: Record<string, { title: string; order: number }> = {
    page: { title: 'Sayfa', order: 1 },
    description: { title: 'Açıklama', order: 2 },
    question: { title: 'Soru', order: 3 },
};

const QUESTION_SUB_CATEGORY_META: Record<string, { title: string; order: number }> = {
    basic: { title: 'Temel', order: 1 },
    choice: { title: 'Seçimli', order: 2 },
    scale: { title: 'Ölçek', order: 3 },
    matrix: { title: 'Matris', order: 4 },
    advanced: { title: 'Gelişmiş', order: 5 },
};

export function groupPaletteItems(items: FormPaletteItemDto[]): FormPaletteGroup[] {
    const activeItems = items.filter((item) => item.isAktif);
    const groups = new Map<string, FormPaletteItemDto[]>();

    for (const item of activeItems) {
        const key = item.category?.trim() || 'question';
        groups.set(key, [...(groups.get(key) ?? []), item]);
    }

    return Array.from(groups.entries())
        .map(([key, groupItems]) => {
            const meta = CATEGORY_META[key] ?? { title: key, order: 99 };
            const sortedItems = [...groupItems].sort((left, right) => left.sira - right.sira);
            return {
                key,
                title: meta.title,
                order: meta.order,
                items: key === 'question' ? [] : sortedItems,
                subGroups: key === 'question' ? groupQuestionItems(sortedItems) : [],
            };
        })
        .sort((left, right) => left.order - right.order);
}

function groupQuestionItems(items: FormPaletteItemDto[]): FormPaletteGroup[] {
    const groups = new Map<string, FormPaletteItemDto[]>();

    for (const item of items) {
        const key = item.subCategory?.trim() || 'advanced';
        groups.set(key, [...(groups.get(key) ?? []), item]);
    }

    return Array.from(groups.entries())
        .map(([key, groupItems]) => {
            const meta = QUESTION_SUB_CATEGORY_META[key] ?? { title: key, order: 99 };
            return {
                key,
                title: meta.title,
                order: meta.order,
                items: [...groupItems].sort((left, right) => left.sira - right.sira),
            };
        })
        .sort((left, right) => left.order - right.order);
}
