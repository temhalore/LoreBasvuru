import { FormPaletteItemDto, FORM_ITEM_TIP, groupPaletteItems } from './form-palette-item.model';

describe('groupPaletteItems', () => {
    it('groups page, description, and question palette items in display order', () => {
        const items: FormPaletteItemDto[] = [
            createItem('question', 'choice', 'Tek Seçim', 103, true),
            createItem('page', null, 'Sayfa', 1, true, FORM_ITEM_TIP.SAYFA),
            createItem('description', null, 'Açıklama', 2, true),
            createItem('question', 'basic', 'Kısa Metin', 101, true),
            createItem('question', 'choice', 'Pasif', 102, false),
        ];

        const result = groupPaletteItems(items);

        expect(result.map((group) => group.key)).toEqual(['page', 'description', 'question']);
        expect(result[0].items.map((item) => item.title)).toEqual(['Sayfa']);
        expect(result[1].items.map((item) => item.title)).toEqual(['Açıklama']);
        expect(result[2].subGroups?.map((group) => group.key)).toEqual(['basic', 'choice']);
        expect(result[2].subGroups?.[0].items.map((item) => item.title)).toEqual(['Kısa Metin']);
        expect(result[2].subGroups?.[1].items.map((item) => item.title)).toEqual(['Tek Seçim']);
    });
});

function createItem(
    category: string,
    subCategory: string | null,
    title: string,
    sira: number,
    isAktif: boolean,
    itemTipId: number = FORM_ITEM_TIP.SORU,
): FormPaletteItemDto {
    return {
        formItemTipKodDto: {
            id: itemTipId,
            tipId: 212,
            kod: itemTipId === FORM_ITEM_TIP.SAYFA ? 'Sayfa' : 'Soru',
            kisaAd: itemTipId === FORM_ITEM_TIP.SAYFA ? 'Sayfa' : 'Soru',
            sira,
            isAktif: true,
            digerUygEnumAd: '',
            digerUygEnumDeger: '',
            ustKodDTO: null,
        },
        soruTipKodDto: itemTipId === FORM_ITEM_TIP.SORU
            ? {
                id: sira,
                tipId: 105,
                kod: title,
                kisaAd: title,
                sira,
                isAktif: true,
                digerUygEnumAd: '',
                digerUygEnumDeger: '',
                ustKodDTO: null,
            }
            : null,
        title,
        description: `${title} açıklaması`,
        category,
        subCategory,
        sira,
        isAktif,
        icon: 'add',
    };
}
