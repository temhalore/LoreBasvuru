import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { QuestionFileModel } from '../../models/question-answer.model';

export interface QuestionFileUploadItem {
    fileName: string;
    extension: string;
    base64Data: string;
}

export interface QuestionFileUploadRequest {
    sessionEid: string;
    questionEid: string;
    groupInstanceEid?: string;
    files: QuestionFileUploadItem[];
}

export interface QuestionFileUploadIssue {
    targetType?: string;
    targetKey?: string;
    message: string;
}

export interface QuestionFileUploadResult {
    files: QuestionFileModel[];
    issues: QuestionFileUploadIssue[];
}

export interface QuestionFileUploadPort {
    uploadFiles(request: QuestionFileUploadRequest): Observable<QuestionFileUploadResult | null>;
}

export const QUESTION_FILE_UPLOAD_PORT = new InjectionToken<QuestionFileUploadPort>('QUESTION_FILE_UPLOAD_PORT');