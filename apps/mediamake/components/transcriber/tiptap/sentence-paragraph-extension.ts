import Paragraph from '@tiptap/extension-paragraph';

export const SentenceParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
    };
  },
});
