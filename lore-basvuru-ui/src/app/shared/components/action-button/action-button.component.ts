import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
export type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ActionButtonComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() loadingText: string = 'Yükleniyor...';
  @Input() outline: boolean = false;
  @Input() fullWidth: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Output() onClick = new EventEmitter<void>();

  handleClick(): void {
    if (!this.disabled && !this.loading) {
      this.onClick.emit();
    }
  }

  get buttonClasses(): string {
    const baseClasses = 'ek-action-btn inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200';
    
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const widthClasses = this.fullWidth ? 'w-full' : '';
    const disabledClasses = (this.disabled || this.loading) ? 'is-disabled' : '';

    return `${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${disabledClasses}`.trim();
  }

  private getVariantClasses(): string {
    if (this.outline) {
      return 'ek-action-btn--outline';
    }

    const variants = {
      primary: 'ek-action-btn--primary',
      secondary: 'ek-action-btn--secondary',
      success: 'ek-action-btn--success',
      danger: 'ek-action-btn--danger',
      warning: 'ek-action-btn--warning',
      info: 'ek-action-btn--info'
    };

    return variants[this.variant] || variants.primary;
  }

  private getSizeClasses(): string {
    const sizes = {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg'
    };

    return sizes[this.size] || sizes.medium;
  }
}
