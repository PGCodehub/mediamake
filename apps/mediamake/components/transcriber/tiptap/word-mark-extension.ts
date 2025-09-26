import { Mark } from '@tiptap/core';

export const WordMark = Mark.create({
  name: 'word',

  addAttributes() {
    return {
      'data-absolute-start': { default: null },
      'data-absolute-end': { default: null },
      'data-confidence': { default: null },
      class: { default: 'word-highlight' },
      title: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[class*="word-highlight"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});
