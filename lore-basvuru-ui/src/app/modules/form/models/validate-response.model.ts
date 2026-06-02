import { DiagnosticDto } from './diagnostic.model';

export class ValidateResponseDto {
    isValid?: boolean | null = null;
    tanilamalar?: DiagnosticDto[] | null = [];
}
