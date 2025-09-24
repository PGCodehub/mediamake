import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { ReplaceStep } from 'prosemirror-transform';
import { CaptionWord } from '@/app/types/transcription';
import { generateId } from 'ai';

interface WordWithPos extends CaptionWord {
  from: number;
  to: number;
}

function parseNodeToWords(node: ProseMirrorNode): CaptionWord[] {
  const words: CaptionWord[] = [];
  if (!node.content || node.content.size === 0) {
    return words;
  }

  node.content.forEach(textNode => {
    if (textNode.isText) {
      const wordMark = textNode.marks.find(mark => mark.type.name === 'word');
      if (wordMark) {
        const wordAttrs = wordMark.attrs;
        words.push({
          id: generateId(),
          text: textNode.text!,
          start: wordAttrs['data-absolute-start'],
          end: wordAttrs['data-absolute-end'],
          absoluteStart: wordAttrs['data-absolute-start'],
          absoluteEnd: wordAttrs['data-absolute-end'],
          confidence: wordAttrs['data-confidence'] || 0.8,
          duration:
            wordAttrs['data-absolute-end'] - wordAttrs['data-absolute-start'],
        });
      }
    }
  });
  return words;
}

function getSentenceNodeAt(doc: ProseMirrorNode, pos: number) {
  // check boundaries to prevent crash
  if (pos < 0 || pos > doc.content.size) {
    return null;
  }
  const resolvedPos = doc.resolve(pos);
  for (let i = resolvedPos.depth; i > 0; i--) {
    const node = resolvedPos.node(i);
    // Looking at the code, sentences are 'paragraph' nodes.
    if (node.type.name === 'paragraph') {
      return { node, pos: resolvedPos.start(i) };
    }
  }
  return null;
}

export const CaptionSyncExtension = Extension.create({
  name: 'captionSync',

  addProseMirrorPlugins() {
    return [
      //   new Plugin({
      //     key: new PluginKey('captionSync'),
      //     appendTransaction: (transactions, oldState, newState) => {
      //       if (oldState.doc.childCount !== newState.doc.childCount) {
      //         return null;
      //       }
      //       let tr = newState.tr;
      //       let modified = false;
      //       const changes: {
      //         from: number;
      //         to: number;
      //         oldNode: ProseMirrorNode;
      //         newNode: ProseMirrorNode;
      //         oldPos: number;
      //         newPos: number;
      //       }[] = [];
      //       transactions.forEach(transaction => {
      //         if (!transaction.docChanged) return;
      //         transaction.steps.forEach(step => {
      //           if (step instanceof ReplaceStep) {
      //             const { from, to } = step;
      //             step.getMap().forEach((_fromA, _toA, fromB, toB) => {
      //               const sentence = getSentenceNodeAt(oldState.doc, from);
      //               if (sentence) {
      //                 const newPos = transaction.mapping.map(sentence.pos);
      //                 const newNode = newState.doc.nodeAt(newPos);
      //                 if (newNode) {
      //                   changes.push({
      //                     from: fromB,
      //                     to: toB,
      //                     oldNode: sentence.node,
      //                     newNode,
      //                     oldPos: sentence.pos,
      //                     newPos,
      //                   });
      //                 }
      //               }
      //             });
      //           }
      //         });
      //       });
      //       changes.forEach(({ from, to, oldNode, newNode, oldPos, newPos }) => {
      //         const oldWords = parseNodeToWords(oldNode);
      //         const newWordsText = newNode.textContent.trim().split(/\s+/);
      //         if (oldWords.length === newWordsText.length) {
      //           return;
      //         }
      //         // Word Merge
      //         if (newWordsText.length < oldWords.length) {
      //           const mergedWordText = newNode.textBetween(from, to, ' ');
      //           const oldWord = oldWords[0];
      //           const newMark = newState.schema.marks.word.create({
      //             ...oldWord,
      //             'data-absolute-end': oldWords[oldWords.length - 1].end,
      //           });
      //           tr.removeMark(
      //             newPos + 1,
      //             newPos + 1 + newNode.nodeSize,
      //             newState.schema.marks.word,
      //           );
      //           tr.addMark(from, from + mergedWordText.length, newMark);
      //           modified = true;
      //         }
      //         // Word Split
      //         else if (newWordsText.length > oldWords.length) {
      //           const charDiff =
      //             newWordsText.join(' ').length -
      //             oldWords.map(w => w.text).join(' ').length;
      //           const oldWord = oldWords[0];
      //           const splitCharIndex = from - oldPos - 1;
      //           const oldWordLength = oldNode.textContent.length;
      //           const splitPercentage = splitCharIndex / oldWordLength;
      //           const splitTimestamp =
      //             oldWord.start + (oldWord.end - oldWord.start) * splitPercentage;
      //           tr.removeMark(
      //             newPos + 1,
      //             newPos + 1 + newNode.nodeSize,
      //             newState.schema.marks.word,
      //           );
      //           const firstWordMark = newState.schema.marks.word.create({
      //             ...oldWord,
      //             'data-absolute-end': splitTimestamp,
      //           });
      //           tr.addMark(
      //             from - 1,
      //             from - 1 + newWordsText[0].length,
      //             firstWordMark,
      //           );
      //           const secondWordMark = newState.schema.marks.word.create({
      //             ...oldWord,
      //             'data-absolute-start': splitTimestamp,
      //           });
      //           tr.addMark(
      //             from,
      //             from + newWordsText.slice(1).join(' ').length,
      //             secondWordMark,
      //           );
      //           modified = true;
      //         }
      //       });
      //       if (modified) {
      //         return tr;
      //       }
      //       return null;
      //     },
      //   }),
    ];
  },
});
