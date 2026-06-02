import { Routes } from '@angular/router';
import { OtpInputExampleComponent } from './otp-input-example.component';

export default [
    {
        path: '',
        component: OtpInputExampleComponent,
        data: {
            title: 'OTP Input Examples'
        }
    }
] as Routes;
