import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoginResponseModel } from 'app/base/models/security/auth/login-response.model';
import { AuthService } from 'app/base/services/auth.service';
import { SweetAlertService } from 'app/base/services/sweet-alert.service';
import { DosyaModel } from 'app/shared/components/minio-file-upload/minio-file-upload.model';

export interface FileUploadConfig {
  isMultiple: boolean;
  maxFileSize: number;
  allowedExtensions: string[];
  title: string;
  description: string;
  buttonText: string;
}

@Component({
  selector: 'app-minio-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minio-file-upload.component.html',
  styleUrls: ['./minio-file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MinioFileUploadComponent implements OnInit {
  private readonly authService: AuthService = inject(AuthService);
  private readonly sweetAlertService: SweetAlertService = inject(SweetAlertService);

  // Configuration Inputs
  @Input() isMultiple: boolean = false;
  @Input() isDragDrop: boolean = true;
  @Input() maxFileSize: number = 1;
  @Input() dosyaTipi: number = 0;
  @Input() dosyaUzanti: string[] = [];
  @Input() minioText: string = "";
  @Input() minioTitle: string = "";
  @Input() minioButonText: string = "Dosyaları bu alana sürükleyin ya da buraya tıklayın";

  // Process Control
  @Input() 
  set isProcessFinished(value: boolean) {
    if (value) {
      this.clearAllFiles();
      this.isUploading$.next(false);
    }
  }

  // Event Emitters
  @Output('minioFileListChangeEvent') fileListChanged = new EventEmitter<BehaviorSubject<DosyaModel[]>>();
  @Output('minioFileUploadChangeEvent') fileUploadTriggered = new EventEmitter<BehaviorSubject<DosyaModel[]>>();

  // State Management
  readonly totalFileSize$ = new BehaviorSubject<number>(0);
  readonly dosyaList$ = new BehaviorSubject<DosyaModel[]>([]);
  readonly isFilePrepared$ = new BehaviorSubject<boolean>(false);
  readonly isDragOver$ = new BehaviorSubject<boolean>(false);
  readonly isUploading$ = new BehaviorSubject<boolean>(false);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  allowedExtensionsText: string = "";
  private allowedExtensionSet = new Set<string>();
  currentUser: LoginResponseModel = this.authService.currentUserValue;

  ngOnInit(): void {
    this.buildAllowedExtensionsText();
  }

  private buildAllowedExtensionsText(): void {
    this.allowedExtensionsText = this.dosyaUzanti.join(', ');
    this.allowedExtensionSet = new Set(this.dosyaUzanti.map((extension) => extension.toLowerCase()));
  }

  private clearAllFiles(): void {
    this.dosyaList$.next([]);
    this.fileListChanged.emit(this.dosyaList$);
    this.totalFileSize$.next(0);
    this.isFilePrepared$.next(false);
  }

  // File Management Methods
  deleteFile(dosya: DosyaModel): void {
    const currentFiles = this.dosyaList$.value;
    const filteredFiles = currentFiles.filter(file => file !== dosya);
    
    this.dosyaList$.next(filteredFiles);
    this.fileListChanged.emit(this.dosyaList$);
    this.totalFileSize$.next(this.totalFileSize$.value - dosya.boyut);
  }

  uploadFiles(): void {
    this.isUploading$.next(true);
    this.fileUploadTriggered.emit(this.dosyaList$);
  }

  deleteAllFiles(): void {
    this.clearAllFiles();
  }

  // File Processing
  onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      this.processFiles(target.files);
    }
  }

  onDragOver(event: DragEvent): void {
    if (!this.isDragDrop) {
      return;
    }
    event.preventDefault();
    this.isDragOver$.next(true);
  }

  onDragLeave(event: DragEvent): void {
    if (!this.isDragDrop) {
      return;
    }
    event.preventDefault();
    this.isDragOver$.next(false);
  }

  onDrop(event: DragEvent): void {
    if (!this.isDragDrop) {
      return;
    }
    event.preventDefault();
    this.isDragOver$.next(false);
    
    if (event.dataTransfer?.files) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  private processFiles(fileList: FileList): void {
    this.isFilePrepared$.next(false);
    
    if (!this.isMultiple) {
      this.dosyaList$.next([]);
      this.totalFileSize$.next(0);
    }

    Array.from(fileList).forEach((file, index) => {
      this.processFile(file, index === fileList.length - 1);
    });
  }

  private processFile(file: File, isLast: boolean): void {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!this.isValidExtension(extension)) {
      this.sweetAlertService.showMessage("error", `${extension} uzantılı dosya yükleyemezsiniz`);
      return;
    }

    if (this.isDuplicateFile(file.name)) {
      this.sweetAlertService.showMessage("error", "Bu dosya zaten yüklenmiş");
      return;
    }

    const newTotalSize = this.totalFileSize$.value + file.size;
    if (newTotalSize > this.maxFileSize * 1024 * 1024) {
      this.sweetAlertService.showMessage("error", 
        `Maksimum dosya boyutunu aştınız. Maksimum: ${this.maxFileSize} MB, ` +
        `Mevcut toplam: ${(newTotalSize / (1024 * 1024)).toFixed(2)} MB`
      );
      return;
    }

    this.totalFileSize$.next(newTotalSize);
    const dosyaModel = this.createDosyaModel(file);
    
    const currentFiles = this.dosyaList$.value;
    this.dosyaList$.next([...currentFiles, dosyaModel]);

    if (isLast) {
      this.clearFileInput();
      setTimeout(() => {
        this.fileListChanged.emit(this.dosyaList$);
        this.isFilePrepared$.next(true);
      }, 100);
    }
  }

  private isValidExtension(extension: string | undefined): boolean {
    return extension ? this.allowedExtensionSet.has(extension) : false;
  }

  private isDuplicateFile(fileName: string): boolean {
    return this.dosyaList$.value.some(file => file.dosyaAd === fileName);
  }

  private createDosyaModel(file: File): DosyaModel {
    const dosya = new DosyaModel();
    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      dosya.dosyaData = result.split(',').pop() || '';
    };

    dosya.uzanti = file.name.split('.').pop() || '';
    dosya.dosyaAd = file.name.replace(`.${dosya.uzanti}`, '');
    dosya.boyut = file.size;
    dosya.dosyaTipKodDto.id = this.dosyaTipi;
    dosya.kisiDto.eid = this.currentUser?.kisiTokenDto?.kisiDto?.eid || '';

    return dosya;
  }

  private clearFileInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Utility Methods
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0';
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  getFileIcon(extension: string): string {
    const iconMap: { [key: string]: string } = {
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'gif': 'fa-file-image',
      'txt': 'fa-file-alt',
      'default': 'fa-file'
    };
    
    return iconMap[extension.toLowerCase()] || iconMap['default'];
  }

  // Backward Compatibility - Eski metodları koruyoruz
  prepareDosya(event: Event): void {
    this.onFileSelect(event);
  }

  // Getter for backward compatibility
  get dosyaUzantiString(): string {
    return this.allowedExtensionsText;
  }
}
