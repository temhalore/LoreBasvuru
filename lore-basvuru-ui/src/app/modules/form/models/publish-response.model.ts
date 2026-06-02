import { DiagnosticDto } from './diagnostic.model';

export class PublishResponseDto {
    basarili?: boolean | null = null;
    yeniYayinDurumKID?: number | null = null;
    tanilamalar?: DiagnosticDto[] | null = [];
}
