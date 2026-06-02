const BLOCK_BREAK_TAG_PATTERN = /<(?:br\s*\/?|\/(?:p|div|li|ul|ol|h[1-6]|tr|td|th|section|article|header|footer|blockquote))\s*>/gi;

function normalizeRichTextHtml(html: string | null | undefined): string {
    return (html ?? '').replace(BLOCK_BREAK_TAG_PATTERN, ' ');
}

export function richTextToPlainText(html: string | null | undefined): string {
    const normalizedHtml = normalizeRichTextHtml(html);
    if (!normalizedHtml.trim()) {
        return '';
    }

    if (typeof document === 'undefined') {
        return normalizedHtml
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const element = document.createElement('div');
    element.innerHTML = normalizedHtml;
    return (element.textContent ?? '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function isRichTextEmpty(html: string | null | undefined): boolean {
    return richTextToPlainText(html).length === 0;
}
