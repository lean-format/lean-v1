import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';
import { parser } from './grammar';

export const leanLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Model: t.definitionKeyword,
        Enum: t.definitionKeyword,
        Relation: t.definitionKeyword,
        Constraint: t.definitionKeyword,
        Type: t.definitionKeyword,
        Doc: t.definitionKeyword,
        Name: t.propertyName,
        String: t.string,
        Number: t.number,
        Arrow: t.operator,
        LineComment: t.lineComment,
        BlockComment: t.blockComment,
        '"{ }': t.brace,
        '"( )': t.paren,
        '"[ ]': t.squareBracket,
        '":"': t.separator,
        '","': t.separator,
      }),
      indentNodeProp.add({
        Block: (context) => context.column(context.node.from) + 2,
      }),
      foldNodeProp.add({
        'Block Model Enum Relation Constraint Type': foldInside,
      }),
    ],
  }),
});

export function leanFormat(): LanguageSupport {
  return new LanguageSupport(leanLanguage);
}
