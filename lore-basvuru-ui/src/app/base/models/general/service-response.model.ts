export class ServiceResponseModel {

  isSuccess?: boolean;
  error_message?: AppExceptionModel;
  hasMessage?: boolean;
  messageType?: string;
  messageHeader?: string;
  message?: string;
  hasAppException?: boolean;
  hasException?: boolean;

  data?: any;
  statusCode?: number;

  appException?: any;

}
export class AppExceptionModel {
  messageHeader?: string
  code?: number
  message?: string
}