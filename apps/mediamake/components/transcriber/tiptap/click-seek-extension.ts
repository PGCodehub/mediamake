import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export const ClickAndSeekExtension = Extension.create({
  name: 'clickAndSeek',

  addOptions() {
    return {
      onSeek: (time: number) => {},
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('clickAndSeekHandler'),
        props: {
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            const seekElement = target.closest('[data-absolute-start]');

            if (seekElement) {
              const absoluteStart = parseFloat(
                seekElement.getAttribute('data-absolute-start') || '0',
              );
              this.options.onSeek(absoluteStart);
              return false; // Event handled
            }

            return false; // Event not handled
          },
        },
      }),
    ];
  },
});
