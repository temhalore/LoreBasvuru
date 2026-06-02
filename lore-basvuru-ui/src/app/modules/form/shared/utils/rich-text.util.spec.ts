import { isRichTextEmpty, richTextToPlainText } from './rich-text.util';

describe('rich text utils', () => {
    it('treats Froala empty paragraphs as empty text', () => {
        expect(isRichTextEmpty('')).toBeTrue();
        expect(isRichTextEmpty('<p><br></p>')).toBeTrue();
        expect(isRichTextEmpty('<p>&nbsp;</p>')).toBeTrue();
    });

    it('extracts readable plain text from rich html', () => {
        expect(richTextToPlainText('<p><strong>Kalin</strong> soru</p><ul><li>Bir</li></ul>'))
            .toBe('Kalin soru Bir');
    });
});
