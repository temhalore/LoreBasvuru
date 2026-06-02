import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
    QuestionFileUploadPort,
    QuestionFileUploadRequest,
    QuestionFileUploadResult,
} from '../../../shared/services/question-file-upload.port';
import { FormRespondentApiService } from './form-respondent-api.service';

@Injectable()
export class RespondentQuestionFileUploadAdapter implements QuestionFileUploadPort {
    constructor(private readonly apiService: FormRespondentApiService) {}

    uploadFiles(request: QuestionFileUploadRequest): Observable<QuestionFileUploadResult | null> {
        return this.apiService.uploadUserFormDosya({
            eid: request.sessionEid,
            soruKokEidDto: { eid: request.questionEid },
            grupInstanceEidDto: request.groupInstanceEid ? { eid: request.groupInstanceEid } : undefined,
            dosyalar: request.files.map((file) => ({
                dosyaAd: file.fileName,
                uzanti: file.extension,
                dosyaData: file.base64Data,
            })),
        }).pipe(
            map((response) => {
                if (!response) {
                    return null;
                }

                return {
                    files: (response.dosyalar ?? []).map((file) => ({
                        eid: file.eid ?? '',
                        label: file.dosyaDto?.dosyaAd ?? '',
                        url: file.url ?? '',
                        extension: file.dosyaDto?.uzanti ?? '',
                        size: file.dosyaDto?.boyut ?? 0,
                    })),
                    issues: (response.hatalar ?? []).map((issue) => ({
                        targetType: issue.targetType,
                        targetKey: issue.targetKey,
                        message: issue.message,
                    })),
                };
            }),
        );
    }
}