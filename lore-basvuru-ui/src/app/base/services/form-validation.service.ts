import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors } from '@angular/forms';


export interface AllValidationErrors {
  control_name: string;
  error_name: string;
  error_value: any;
}

export interface FormGroupControls {
  [key: string]: AbstractControl;
}
@Injectable({
  providedIn: 'root'
})
export class FormValidationService {
  constructor() {
  }

  getFormControlValidationErrors(controls: FormGroupControls,controlName:string): AllValidationErrors[] {
    let errors: AllValidationErrors[] = [];
    Object.keys(controls).forEach(key => {

      if(key==controlName){



      const control = controls[key];
      if (control instanceof FormGroup) {
        errors = errors.concat(this.getFormValidationErrors(control.controls));
      }
      let controlErrors: any = controls[key].errors;//any=>ValidationErrors
      if (controlErrors !== null) {
        Object.keys(controlErrors).forEach(keyError => {
          errors.push({
            control_name: key,
            error_name: keyError,
            error_value: controlErrors[keyError]
          });
        });
      }
    } });
  
    return errors;
  }

  getFormValidationErrors(controls: FormGroupControls): AllValidationErrors[] {
    let errors: AllValidationErrors[] = [];
    Object.keys(controls).forEach(key => {
      const control = controls[key];
      if (control instanceof FormGroup) {
        errors = errors.concat(this.getFormValidationErrors(control.controls));
      }
      let controlErrors: any = controls[key].errors;//any=>ValidationErrors
      if (controlErrors !== null) {
        Object.keys(controlErrors).forEach(keyError => {
          errors.push({
            control_name: key,
            error_name: keyError,
            error_value: controlErrors[keyError]
          });
        });
      }
    });
    return errors;
  }
  isControlValid(formGroup: FormGroup, controlName: string): boolean {
    const control = formGroup.controls[controlName];
    return !!(control && control.valid && (control.dirty || control.touched));
  }

  isControlInvalid(formGroup: FormGroup, controlName: string): boolean {
    const control = formGroup.controls[controlName];
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  controlHasError(formGroup: FormGroup, validation:any, controlName:any): boolean {
    const control = formGroup.controls[controlName];
    return !!(control && control.hasError(validation) && (control.dirty || control.touched));
  }
  isControlTouched(formGroup: FormGroup, controlName:any): boolean {
    const control = formGroup.controls[controlName];
    return !!(control && (control.dirty || control.touched));
  }
}




