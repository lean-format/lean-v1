import { LanguageSupport } from '@codemirror/language';
import { lintGutter } from '@codemirror/lint';
import { leanLanguage } from './lean-language';
import { leanAutocomplete } from './language';

export { leanLanguage, leanAutocomplete };

export function leanFormat(): LanguageSupport {
  return new LanguageSupport(leanLanguage);
}

export function leanFormatExtension() {
  return [
    new LanguageSupport(leanLanguage),
    leanAutocomplete(),
    lintGutter(),
  ];
}
