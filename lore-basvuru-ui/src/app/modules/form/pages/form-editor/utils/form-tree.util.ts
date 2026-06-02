import { FormDto, PageDto, QuestionDto } from '../../../models';

export type ContainerKind = 'page' | 'question';

export interface QuestionContainerContext {
    pageEid: string;
    parentQuestionEid: string | null;
}

export type ContainerRef =
    | { kind: 'page'; page: PageDto }
    | { kind: 'question'; question: QuestionDto };

import { questionDtoCanOpenChildWorkspace } from './form-editor-action-resolver.util';

export type QuestionChildrenMutator = (children: QuestionDto[]) => QuestionDto[];

export function findPage(form: FormDto | null, pageEid: string | null): PageDto | null {
    if (!form || !pageEid) {
        return null;
    }

    return (form.sayfalar ?? []).find((page) => page.eid === pageEid) ?? null;
}

export function findPageIndex(form: FormDto | null, pageEid: string | null): number {
    if (!form || !pageEid) {
        return -1;
    }

    return (form.sayfalar ?? []).findIndex((page) => page.eid === pageEid);
}

export function findQuestion(form: FormDto | null, questionEid: string): QuestionDto | null {
    if (!form || !questionEid) {
        return null;
    }

    for (const page of form.sayfalar ?? []) {
        const found = findQuestionInTree(page.sorular ?? [], questionEid);
        if (found) {
            return found;
        }
    }

    return null;
}

export function findContainer(form: FormDto | null, containerEid: string | null): ContainerRef | null {
    if (!form || !containerEid) {
        return null;
    }

    const page = findPage(form, containerEid);
    if (page) {
        return { kind: 'page', page };
    }

    const question = findQuestion(form, containerEid);
    if (question) {
        return { kind: 'question', question };
    }

    return null;
}

export function findContainerChildren(form: FormDto | null, containerEid: string | null): QuestionDto[] | null {
    const ref = findContainer(form, containerEid);
    if (!ref) {
        return null;
    }

    return ref.kind === 'page' ? (ref.page.sorular ?? []) : (ref.question.altSorular ?? []);
}

export function findContainerPageEid(form: FormDto | null, containerEid: string | null): string | null {
    if (!form || !containerEid) {
        return null;
    }

    if (findPage(form, containerEid)) {
        return containerEid;
    }

    for (const page of form.sayfalar ?? []) {
        if (questionTreeContainsNode(page.sorular ?? [], containerEid)) {
            return page.eid;
        }
    }

    return null;
}

export function resolveQuestionContainerContext(
    form: FormDto | null,
    containerEid: string | null,
): QuestionContainerContext | null {
    const container = findContainer(form, containerEid);
    if (!container) {
        return null;
    }

    if (container.kind === 'page') {
        return {
            pageEid: container.page.eid,
            parentQuestionEid: null,
        };
    }

    const pageEid = findContainerPageEid(form, containerEid);
    if (!pageEid) {
        return null;
    }

    return {
        pageEid,
        parentQuestionEid: container.question.eid,
    };
}

export function questionTreeContainsNode(questions: QuestionDto[], nodeEid: string): boolean {
    for (const question of questions) {
        if (question.eid === nodeEid) {
            return true;
        }

        if (questionTreeContainsNode(question.altSorular ?? [], nodeEid)) {
            return true;
        }
    }

    return false;
}

export function resolvePageEidFromNode(form: FormDto | null, nodeEid: string): string | null {
    if (!form) {
        return null;
    }

    const directPage = findPage(form, nodeEid);
    if (directPage) {
        return directPage.eid;
    }

    for (const page of form.sayfalar ?? []) {
        if (questionTreeContainsNode(page.sorular ?? [], nodeEid)) {
            return page.eid;
        }
    }

    return form.sayfalar?.[0]?.eid ?? null;
}

export function collectContainerEids(form: FormDto | null): Set<string> {
    const eids = new Set<string>();
    if (!form) {
        return eids;
    }

    for (const page of form.sayfalar ?? []) {
        eids.add(page.eid);
        collectQuestionContainerEids(page.sorular ?? [], eids);
    }

    return eids;
}

export function countQuestions(questions: QuestionDto[]): number {
    return questions.reduce(
        (total, question) => total + 1 + countQuestions(question.altSorular ?? []),
        0,
    );
}

export function cloneQuestion(question: QuestionDto): QuestionDto {
    if (typeof structuredClone === 'function') {
        return structuredClone(question);
    }

    return JSON.parse(JSON.stringify(question)) as QuestionDto;
}

export function updateContainerChildren(
    form: FormDto | null,
    containerEid: string,
    mutator: QuestionChildrenMutator,
): FormDto | null {
    if (!form || !containerEid) {
        return form;
    }

    let mutated = false;

    const nextSayfalar = (form.sayfalar ?? []).map((page) => {
        if (mutated) {
            return page;
        }

        if (page.eid === containerEid) {
            mutated = true;
            return { ...page, sorular: mutator(page.sorular ?? []) };
        }

        const nextSorular = mutateChildrenInQuestionTree(page.sorular ?? [], containerEid, mutator);
        if (nextSorular !== null) {
            mutated = true;
            return { ...page, sorular: nextSorular };
        }

        return page;
    });

    if (!mutated) {
        return form;
    }

    return { ...form, sayfalar: nextSayfalar };
}

export function insertQuestion(
    form: FormDto | null,
    containerEid: string,
    question: QuestionDto,
): FormDto | null {
    return updateContainerChildren(form, containerEid, (children) => {
        const next = children.some((item) => item.eid === question.eid)
            ? children.map((item) => (item.eid === question.eid ? question : item))
            : [...children, question];

        return next.sort((left, right) => (left.sira ?? 0) - (right.sira ?? 0));
    });
}

export function replaceQuestion(form: FormDto | null, savedQuestion: QuestionDto): FormDto | null {
    if (!form) {
        return form;
    }

    return {
        ...form,
        sayfalar: (form.sayfalar ?? []).map((page) => ({
            ...page,
            sorular: replaceQuestionInTree(page.sorular ?? [], savedQuestion),
        })),
    };
}

function findQuestionInTree(questions: QuestionDto[], questionEid: string): QuestionDto | null {
    for (const question of questions) {
        if (question.eid === questionEid) {
            return question;
        }

        const child = findQuestionInTree(question.altSorular ?? [], questionEid);
        if (child) {
            return child;
        }
    }

    return null;
}

function mutateChildrenInQuestionTree(
    questions: QuestionDto[],
    containerEid: string,
    mutator: QuestionChildrenMutator,
): QuestionDto[] | null {
    let changed = false;

    const next = questions.map((question) => {
        if (changed) {
            return question;
        }

        if (question.eid === containerEid) {
            changed = true;
            return { ...question, altSorular: mutator(question.altSorular ?? []) };
        }

        const nextChildren = mutateChildrenInQuestionTree(question.altSorular ?? [], containerEid, mutator);
        if (nextChildren !== null) {
            changed = true;
            return { ...question, altSorular: nextChildren };
        }

        return question;
    });

    return changed ? next : null;
}

function replaceQuestionInTree(questions: QuestionDto[], savedQuestion: QuestionDto): QuestionDto[] {
    return questions.map((question) => {
        if (question.eid === savedQuestion.eid) {
            return savedQuestion;
        }

        return {
            ...question,
            altSorular: question.altSorular
                ? replaceQuestionInTree(question.altSorular, savedQuestion)
                : question.altSorular,
        };
    });
}

function collectQuestionContainerEids(questions: QuestionDto[], acc: Set<string>): void {
    for (const question of questions) {
        if (questionDtoCanOpenChildWorkspace(question)) {
            acc.add(question.eid);
            collectQuestionContainerEids(question.altSorular ?? [], acc);
        }
    }
}
