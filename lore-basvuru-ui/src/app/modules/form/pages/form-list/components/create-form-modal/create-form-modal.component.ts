import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { FormCreateReqModel } from 'app/modules/form/pages/form-list/models/form-create-req.model';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { ActionButtonComponent } from 'app/shared/components/action-button/action-button.component';
import { CheckboxInputComponent } from 'app/shared/components/form-controls/checkbox-input/checkbox-input.component';
import { TextareaInputComponent } from 'app/shared/components/form-controls/textarea-input/textarea-input.component';
import { TextInputComponent } from 'app/shared/components/form-controls/text-input/text-input.component';
import { FORM_CREATE_RESPONSE_ERROR_MESSAGE, FormListService } from '../../form-list.service';

@Component({
	selector: 'app-admin-create-form-modal',
	standalone: true,
	templateUrl: './create-form-modal.component.html',
	styleUrls: ['./create-form-modal.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatDialogModule,
		TextInputComponent,
		TextareaInputComponent,
		CheckboxInputComponent,
		ActionButtonComponent,
	],
	providers: [SweetAlertService],
})
export class CreateFormModalComponent implements OnDestroy {
	readonly formListService: FormListService = inject(FormListService);

	readonly formGroup = this.formBuilder.group({
		baslik: ['', [Validators.required, Validators.maxLength(200)]],
		aciklama: [''],
		isPublic: [false],
	});

	private readonly subscriptions: Subscription[] = [];

	constructor(
		private readonly formBuilder: FormBuilder,
		private readonly dialogRef: MatDialogRef<CreateFormModalComponent, 'success'>,
		private readonly sweetAlertService: SweetAlertService,
	) {}

	close(): void {
		if (!this.formListService.isLoading) {
			this.dialogRef.close();
		}
	}

	save(): void {
		if (this.formListService.isLoading) {
			return;
		}

		if (this.formGroup.invalid) {
			this.formGroup.markAllAsTouched();
			return;
		}

		const request = this.buildRequest();

		this.formGroup.patchValue({
			baslik: request.baslik,
			aciklama: request.aciklama,
		});

		const createSubscription = this.formListService.createForm(request).subscribe({
			next: () => this.dialogRef.close('success'),
			error: (error: unknown) => this.handleCreateError(error),
		});

		this.subscriptions.push(createSubscription);
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((subscription) => subscription.unsubscribe());
	}

	private buildRequest(): FormCreateReqModel {
		const request = new FormCreateReqModel();

		request.baslik = (this.formGroup.controls.baslik.value ?? '').trim();
		request.aciklama = (this.formGroup.controls.aciklama.value ?? '').trim();
		request.isPublic = this.formGroup.controls.isPublic.value ?? false;

		return request;
	}

	private handleCreateError(error: unknown): void {
		if (error instanceof Error && error.message) {
			this.sweetAlertService.showMessage('error', error.message);
		}
	}
}
