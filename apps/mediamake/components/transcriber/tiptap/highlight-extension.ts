import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';

export const HighlightPluginKey = new PluginKey('highlight');

// Function to update the current time in the plugin state
export const updateHighlightTime = (time: number, view: any): void => {
  if (!view) return;
  const { dispatch, state } = view;
  const tr = state.tr.setMeta(HighlightPluginKey, { currentTime: time });
  dispatch(tr);
};

export const HighlightExtension = Extension.create({
  name: 'highlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: HighlightPluginKey,
        state: {
          init() {
            return { currentTime: 0 };
          },
          apply(tr, value) {
            const meta = tr.getMeta(HighlightPluginKey);
            if (meta && typeof meta.currentTime !== 'undefined') {
              return { currentTime: meta.currentTime };
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            const { doc } = state;
            const pluginState = this.getState(state);
            if (!pluginState) return DecorationSet.empty;

            const { currentTime } = pluginState;
            const decorations: Decoration[] = [];

            if (currentTime <= 0) {
              return DecorationSet.empty;
            }

            doc.descendants((node, pos) => {
              if (node.type.name === 'paragraph') {
                let inThisParagraph = false;
                node.descendants((wordNode, wordPos) => {
                  if (wordNode.isText) {
                    const wordMark = wordNode.marks.find(
                      mark => mark.type.name === 'word',
                    );
                    if (wordMark) {
                      const wordStart = parseFloat(
                        wordMark.attrs['data-absolute-start'],
                      );
                      const wordEnd = parseFloat(
                        wordMark.attrs['data-absolute-end'],
                      );
                      if (currentTime >= wordStart && currentTime < wordEnd) {
                        const absolutePos = pos + 1 + wordPos;
                        inThisParagraph = true;
                        decorations.push(
                          Decoration.inline(
                            absolutePos,
                            absolutePos + wordNode.nodeSize,
                            { class: 'current-word' },
                          ),
                        );
                      }
                    }
                  }
                });

                let paragraphStarts = parseFloat(
                  node.firstChild?.marks.find(mark => mark.type.name === 'word')
                    ?.attrs['data-absolute-start'] || 0,
                );
                let paragraphEnds = parseFloat(
                  node.lastChild?.marks.find(mark => mark.type.name === 'word')
                    ?.attrs['data-absolute-end'] || 0,
                );

                if (
                  !inThisParagraph &&
                  currentTime >= paragraphStarts &&
                  currentTime < paragraphEnds
                ) {
                  inThisParagraph = true;
                }

                if (inThisParagraph) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      class: 'current-sentence',
                    }),
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
