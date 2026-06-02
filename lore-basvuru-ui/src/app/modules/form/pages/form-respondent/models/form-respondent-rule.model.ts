export type RuleOperator = 'eq' | 'neq' | 'in' | 'notIn' | 'gt' | 'lt' | 'empty' | 'notEmpty';

/**
 * Rule JSON içindeki koşul tanımı.
 * NOT: Rule JSON hâlâ numeric KokId referansları kullanır.
 * EID migration Faz-2'de bu alanlar da eid'ye taşınacaktır.
 */
export interface RuleCondition {
    kaynakSoruKokId: number;
    operator: RuleOperator;
    deger: string | number | number[];
}

export interface QuestionRuleJson {
    hedefSoruKokId: number;
    kosul: RuleCondition;
    tersine: boolean;
}

export interface PageSkipCondition {
    operator: RuleOperator;
    deger: string | number;
    hedefSayfaKokId: number;
}

export interface PageSkipRuleJson {
    kaynakSoruKokId: number;
    kosullar: PageSkipCondition[];
    varsayilanSayfaKokId: number | null;
}

export interface WidgetState {
    visible: boolean;
    disabled: boolean;
    required: boolean | null;
}
