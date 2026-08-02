import { documentoValidator } from './documento.validator';
import { maiorQueZero } from './maior-que-zero.validator';

export class CustomValidators {
  static documento = documentoValidator;
  static maiorQueZero = maiorQueZero;
}
