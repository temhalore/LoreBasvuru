import { Component, Input, OnInit, SimpleChanges, ViewEncapsulation, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import FroalaEditor from 'froala-editor';
import 'froala-editor/js/plugins/code_view.min.js';
import 'froala-editor/js/plugins/image.min.js';
import 'froala-editor/js/plugins/align.min.js';
import 'froala-editor/js/plugins/lists.min.js';
import 'froala-editor/js/plugins/link.min.js';
import 'froala-editor/js/plugins/colors.min.js';
import 'froala-editor/js/plugins/fullscreen.min.js';
import 'froala-editor/js/plugins/char_counter.min.js';
import 'froala-editor/js/plugins/paragraph_format.min.js';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import { AllValidationErrors, FormValidationService } from 'app/base/services/form-validation.service';
import { HttpService } from 'app/base/services/http.service';

@Component({
  selector: 'app-froala-textarea-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FroalaEditorModule,
    FroalaViewModule
  ],
  templateUrl: './froala-textarea-input.component.html',
  styleUrl: './froala-textarea-input.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [FormValidationService],
})
export class FroalaTextAreaInputComponent implements OnInit, OnChanges {
  @Input() nameOfFormGroup!: FormGroup;
  @Input() controlName: string = '';
  @Input() title: string = '';
  @Input() placeHolder: string = '';
  @Input() tooltipTitle: string = '';
  @Input() isRequired: boolean = false;
  @Input() isPlainText: boolean = false;
  @Input() editorHeight: number = 200;
  @Input() modulKodId: number = 0;
  @Input() dosyaTipKodId: number = 0;
  @Input() showHtmlPreview: boolean = false;
  @Input() uploadUserFormEid: string = '';
  @Input() uploadSoruKokEid: string = '';
  @Input() uploadGrupInstanceEid: string = '';
  @Input() uploadDegerlendirmeDetayEid: string = '';

  @Input() customClass: string =
    'form-control form-control-lg form-control-solid';
  options: Object = {
    ...(this.isPlainText &&
    {
    }),
  };

  hasToltip: boolean = false;
  /** Froala'nın contentChanged event'inde base64 resim URL'ye çevrilirken sonsuz döngüyü önler. */
  private isReplacingBase64Images = false;
  /** valueChanges subscribe'ında base64→URL normalizasyonu sırasında tekrar tetiklemeyi önler. */
  private isNormalizingControlValue = false;
  /**
   * contentChanged ile editörde güncellenen GetDosyaByKey tam URL'leri
   * form control'deki bare dosyaKey'e indirilirken sonsuz döngüyü önler.
   * stripKeyUrlsControlValue tarafından set/unset edilir.
   */
  private isStrippingKeyUrls = false;
  private subscriptions: Subscription[] = [];
  constructor(
    public readonly formValidationService: FormValidationService,
    private readonly httpService: HttpService
  ) {
    if (this.tooltipTitle !== '') {
      this.hasToltip = true;
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isPlainText'] || changes['editorHeight'] || changes['placeHolder']) {
      this.setFroalaOptions(); // değer değişince yeniden setle
    }
  }

  ngOnInit() {
    this.setFroalaOptions();
    const control = this.nameOfFormGroup.get(this.controlName);

    if (control) {
      // Froala'ya başlangıç değerini atayın
      control.setValue(control.value || '');

      // Degerlendirme ekranlarinda upload save aninda backend tarafinda yapilir.
      if (!this.canUploadByContext()) {
        return;
      }

      // valueChanges: editörde oluşan her HTML değişikliğini yakalar.
      // İki ayrı durum yönetilir:
      //  1) Editör tam GetDosyaByKey URL'si yazmışsa → form control'de bare dosyaKey'e indir
      //     (DB/form'da domain bağımsız veri saklanır; editör görüntüsü değişmez).
      //  2) Kopyala-yapıştır ile gelen base64 resim → MinIO'ya yükle, URL ile değiştir.
      const sub = control.valueChanges.subscribe((value) => {
        if (this.isNormalizingControlValue || this.isStrippingKeyUrls || typeof value !== 'string') {
          return;
        }

        // Sadece key URL varsa hemen bare key'e indir; hem key URL hem base64 varsa
        // normalize akışının devam etmesine izin ver.
        if (value.indexOf('GetDosyaByKey') >= 0 && value.indexOf('data:image/') < 0) {
          void this.stripKeyUrlsControlValue(control, value);
          return;
        }

        if (value.indexOf('data:image/') < 0) {
          return;
        }

        if (!this.canUploadByContext()) {
          return;
        }

        void this.normalizeControlValue(control, value);
      });
      this.subscriptions.push(sub);
    }
  }

  private isDegerlendirmeUploadContext(): boolean {
    return !!this.uploadDegerlendirmeDetayEid;
  }

  private canUploadByContext(): boolean {
    // Artık tüm Froala instance'larında resim yükleme destekleniyor.
    // FormRespondent bağlamı varsa oraya, yoksa FileController/UploadInlineImage endpoint'ine yüklenir.
    return true;
  }

  private async normalizeControlValue(control: AbstractControl, value: string): Promise<void> {
    const normalizedHtml = await this.normalizeBase64ImagesInHtml(value);
    if (!normalizedHtml || normalizedHtml === value) {
      return;
    }

    this.isNormalizingControlValue = true;
    try {
      const forStorage = this.stripKeyUrlsInHtml(normalizedHtml);
      if (forStorage !== normalizedHtml) {
        // Editörü önce tam URL ile güncelle → editörde resim görünecek.
        control.setValue(normalizedHtml, { emitEvent: false });
        // Form control'ü bare dosyaKey ile güncelle; emitModelToViewChange:false
        // sayesinde Froala writeValue() çağrılmaz → editör bozulmaz.
        control.setValue(forStorage, { emitEvent: false, emitModelToViewChange: false } as any);
      } else {
        control.setValue(normalizedHtml, { emitEvent: false });
      }
    } finally {
      this.isNormalizingControlValue = false;
    }
  }

  /**
   * Form control değerindeki GetDosyaByKey tam URL'lerini bare dosyaKey'e (örn. "XYZ123") indirir.
   *
   * Neden gerekli:
   *   Resim yüklenince editöre tam URL basılır (editörün resmi göstermesi için zorunlu).
   *   Froala contentChanged tetiklenir → Angular form control'ü tam URL ile günceller.
   *   Oysa form control / DB'de sadece dosyaKey saklanmalı (domain/path bağımsızlığı).
   *   Bu metod tam URL'yi soyarak form control'ü düzeltir.
   *
   * emitModelToViewChange: false → ControlValueAccessor.writeValue() çağrılmaz,
   *   Froala editörü tekrar güncellenmez (sonsuz döngü önlenir, resim kaybolmaz).
   */
  private async stripKeyUrlsControlValue(control: AbstractControl, value: string): Promise<void> {
    const stripped = this.stripKeyUrlsInHtml(value);
    if (!stripped || stripped === value) {
      return;
    }

    this.isStrippingKeyUrls = true;
    try {
      control.setValue(stripped, { emitEvent: false, emitModelToViewChange: false } as any);
    } finally {
      this.isStrippingKeyUrls = false;
    }
  }

  private async insertImagesFromFiles(editor: any, files: File[] | FileList | null | undefined): Promise<void> {
    if (!files) {
      return;
    }

    const fileArray = Array.from(files as ArrayLike<File>)
      .filter((file) => file && file.type?.startsWith('image/'));

    for (const file of fileArray) {
      let imageSrc = '';

      if (this.isDegerlendirmeUploadContext()) {
        // Değerlendirme bağlamında backend taraflı save sırasında işlenir; base64 olarak bırak.
        imageSrc = await this.fileToDataUrl(file);
      } else if (this.canUploadToFormRespondent()) {
        imageSrc = await this.uploadToFormRespondent(file);
      } else {
        // Genel bağlam: BaseFormRespondent yoksa FileController/UploadInlineImage endpoint'ine yükle.
        // uploadToFileController → bare dosyaKey döner (örn. "ABC123").
        // dosyaKeyToViewUrl() ile tam URL'ye çevrilerek editöre basılır → resim görünür.
        // contentChanged tetiklenince stripKeyUrlsControlValue → form control'de bare dosyaKey kalır.
        const dosyaKey = await this.yukleInlineImage(file);
        imageSrc = dosyaKey ? this.dosyaKeyToViewUrl(dosyaKey) : '';
      }

      if (!imageSrc) {
        continue;
      }

      editor.html.insert(`<img src="${imageSrc}" alt="image" />`);
      editor.events.trigger('contentChanged', []);
    }
  }

  private dataUrlToFile(dataUrl: string, fileName: string): File | null {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return null;
    }

    const parts = dataUrl.split(',');
    if (parts.length < 2) {
      return null;
    }

    const meta = parts[0];
    const base64 = parts[1];
    const mimeMatch = /data:(image\/[a-zA-Z0-9.+-]+);base64/.exec(meta);
    const mimeType = mimeMatch?.[1] ?? 'image/png';

    try {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return new File([bytes], fileName, { type: mimeType });
    } catch {
      return null;
    }
  }

  private async uploadImageByContext(file: File): Promise<string> {
    if (this.canUploadToFormRespondent()) {
      return await this.uploadToFormRespondent(file);
    }

    // uploadToFileController bare dosyaKey döner; editör için tam URL'ye çevir.
    const dosyaKey = await this.yukleInlineImage(file);
    return dosyaKey ? this.dosyaKeyToViewUrl(dosyaKey) : '';
  }

  private async normalizeBase64ImagesInHtml(htmlContent: string): Promise<string> {
    if (!htmlContent || htmlContent.indexOf('data:image/') < 0) {
      return htmlContent;
    }

    const container = document.createElement('div');
    container.innerHTML = htmlContent;

    const images = Array.from(container.querySelectorAll('img'));
    const base64Images = images.filter((img) => (img.getAttribute('src') || '').startsWith('data:image/'));
    if (base64Images.length === 0) {
      return htmlContent;
    }

    for (let i = 0; i < base64Images.length; i++) {
      const img = base64Images[i];
      const src = img.getAttribute('src') || '';
      const file = this.dataUrlToFile(src, `pasted-image-${Date.now()}-${i}.png`);
      if (!file) {
        continue;
      }

      const uploadedUrl = await this.uploadImageByContext(file);
      if (!uploadedUrl) {
        continue;
      }

      img.setAttribute('src', uploadedUrl);
    }

    return container.innerHTML;
  }

  private async replaceBase64ImagesWithUploadedUrls(editor: any): Promise<void> {
    if (!this.canUploadByContext() || this.isReplacingBase64Images) {
      return;
    }

    const htmlContent: string = editor?.html?.get?.() ?? '';
    const normalizedHtml = await this.normalizeBase64ImagesInHtml(htmlContent);
    if (!normalizedHtml || normalizedHtml === htmlContent) {
      return;
    }

    this.isReplacingBase64Images = true;
    try {
      editor.html.set(normalizedHtml);
      editor.events.trigger('contentChanged', []);
    } finally {
      this.isReplacingBase64Images = false;
    }
  }

  private canUploadToFormRespondent(): boolean {
    return !!this.uploadUserFormEid && !!this.uploadSoruKokEid;
  }

  /**
   * Froala inline resimleri için kullanılan yükleme endpoint'i.
   *
   * Modül tipi  : FLORA_INPUT_DOSYA (1160002)    — backend'de sabit
   * Dosya tipi  : FLORA_INPUT_GENEL_RESIM (1170002) — backend'de sabit
   * Frontend sadece dosyayı gönderir; modül/tip bilgisi gönderilmez.
   *
   * Dönüş: bare dosyaKey (örn. "QWta...").
   *   Çağıran taraf dosyaKeyToViewUrl() ile editör için tam URL'ye çevirir.
   *   Form control/DB'ye daima bare dosyaKey kaydedilir.
   */
  private async yukleInlineImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response: any = await firstValueFrom(
        this.httpService.PostFormData('Common/File/UploadInlineImage', formData)
      );

      if (!response?.isSuccess) {
        return '';
      }

      return response?.data?.dosyaKey ?? '';
    } catch {
      return '';
    }
  }

  /**
   * Bare dosyaKey → editörde görüntülenebilir tam GetDosyaByKey URL'si.
   *
   * Örnek: "XYZ123" → "https://localhost:9247/Api/Common/File/GetDosyaByKey?dosyaKey=XYZ123"
   *
   * Bu URL YALNIZCA editörün içine yazılır; form control/DB'ye hiçbir zaman kaydedilmez.
   * Domain ya da API path değişirse sadece bu metodu güncellemek yeterlidir.
   */
  private dosyaKeyToViewUrl(dosyaKey: string): string {
    return `${this.httpService.API_URL}Common/File/GetDosyaByKey?dosyaKey=${encodeURIComponent(dosyaKey)}`;
  }

  /**
   * HTML içindeki GetDosyaByKey tam URL'lerini bare dosyaKey'e indirir.
   *
   * Örnek: src="https://.../GetDosyaByKey?dosyaKey=XYZ123" → src="XYZ123"
   *
   * Neden: Form control ve DB'de alan domain değişimlerinden bağımsız,
   *   sadece dosyaKey saklanmalıdır. stripKeyUrlsControlValue bu metodu kullanır.
   */
  private stripKeyUrlsInHtml(html: string): string {
    const pattern = new RegExp(
      'https?://[^"\']+/Common/File/GetDosyaByKey\\?dosyaKey=([^"\'&\\s]+)',
      'g'
    );
    return html.replace(pattern, (_match: string, encodedKey: string) => {
      try { return decodeURIComponent(encodedKey); } catch { return encodedKey; }
    });
  }

  /**
   * Mevcut kayıt açılırken form control'deki bare dosyaKey'leri editörde
   * görüntülenebilir tam GetDosyaByKey URL'sine genişletir.
   *
   * Örnek: src="XYZ123" → src="https://.../GetDosyaByKey?dosyaKey=XYZ123"
   *
   * Froala initialized event'inde çağrılır; yalnızca editor.html.set() ile
   * editörü günceller — form control değerine dokunmaz.
   * Bu sayede DB'deki bare dosyaKey korunur, resim editörde görünür.
   */
  private expandKeysInHtmlForEditor(html: string): string {
    return html.replace(
      /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
      (_match, before, src, after) => {
        const trimmed = src.trim();
        if (
          trimmed.startsWith('http://') ||
          trimmed.startsWith('https://') ||
          trimmed.startsWith('data:image/')
        ) {
          return `${before}${src}${after}`;
        }
        return `${before}${this.dosyaKeyToViewUrl(trimmed)}${after}`;
      }
    );
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  private async uploadToFormRespondent(file: File): Promise<string> {
    try {
      const dataUrl = await this.fileToDataUrl(file);
      if (!dataUrl) {
        return '';
      }

      const commaIndex = dataUrl.indexOf(',');
      const base64Data = commaIndex >= 0 ? dataUrl.substring(commaIndex + 1) : dataUrl;
      const extension = this.getFileExtension(file.name);

      const request: any = {
        eid: this.uploadUserFormEid,
        soruKokEidDto: { eid: this.uploadSoruKokEid },
        dosyalar: [
          {
            dosyaAd: file.name,
            uzanti: extension,
            dosyaData: base64Data,
          },
        ],
      };

      if (this.uploadGrupInstanceEid) {
        request.grupInstanceEidDto = { eid: this.uploadGrupInstanceEid };
      }

      const response: any = await firstValueFrom(this.httpService.Post('FormRespondent/Dosya/Yukle', request));
      if (!response?.isSuccess) {
        return '';
      }

      const firstFile = response?.data?.dosyalar?.[0];
      return firstFile?.url ?? '';
    } catch {
      return '';
    }
  }

  private getFileExtension(fileName: string): string {
    if (!fileName) {
      return '';
    }

    const index = fileName.lastIndexOf('.');
    return index >= 0 ? fileName.substring(index + 1).toLowerCase() : '';
  }

// Froala Editor için resim yükleme ve görüntüleme ayarları
setFroalaOptions() {
  const component = this;
  const defaultToolbarButtons = [
    'html',
    'insertImage',
    '|',
    'bold',
    'italic',
    'underline',
    'strikeThrough',
    'clearFormatting',
    '|',
    'alignLeft',
    'alignCenter',
    'alignRight',
    'alignJustify',
    '|',
    'formatOL',
    'formatUL',
    'outdent',
    'indent',
    '|',
    'insertLink',
    'textColor',
    'backgroundColor',
    '|',
    'undo',
    'redo',
    'fullscreen'
  ];

  this.options = this.isPlainText
    ? {
        plainText: true,
        pastePlain: true,
        height: this.editorHeight,
        quickInsertEnabled: false,
        toolbarInline: false,
        language: 'tr',
        placeholderText: this.placeHolder || 'Yazmaya başlayın...',
        charCounterCount: false,
        htmlAllowedTags: [],
        htmlAllowedAttrs: [],
        htmlRemoveTags: [],
        htmlRemoveAttrs: [],
      }
    : {
        height: this.editorHeight,
        language: 'tr',
        quickInsertEnabled: false,
        toolbarInline: false,
        pastePlain: false,
        placeholderText: this.placeHolder || 'Yazmaya başlayın...',
        charCounterCount: true,
        key: 'ZOD3gB8C8C5B5E2G3C-8jwqgijC-11fE4iiB-22A8dcnD5D4B3D3C3D7C7C2B4G5==',
        pluginsEnabled: ['codeView', 'image', 'align', 'lists', 'link', 'colors', 'fullscreen', 'charCounter', 'paragraphFormat'],

      // Resim ekleme ayarları
        imageUpload: true,
        imageAllowedTypes: ['jpeg', 'jpg', 'png'],
        imageMaxSize: 5 * 1024 * 1024,

        // Resim düzenleme ayarları
        imageEditButtons: ['imageDisplay', 'imageAlign', 'imageInfo', 'imageRemove', 'imageLink', 'imageSize', 'imageAlt'],
        imageInsertButtons: ['imageBack', '|', 'imageUpload', 'imageByURL'],
        imageDefaultDisplay: 'inline',
        imageDefaultWidth: 300,
        imageDefaultAlign: 'center',

        // Resim tıklandığında düzenleme araç çubuğunu göster
        imageResize: true,
        imageResizeWithPercent: true,
        imageRoundPercent: true,

        // HTML kodu görüntüleme modunu etkinleştir
        htmlUntouched: true,
        htmlAllowComments: false,

        events: {
          'initialized': function (this: any) {
            const host = this.el as HTMLElement;
            if (!host) {
              return;
            }

            host.addEventListener('dragover', (event: DragEvent) => {
              const files = event.dataTransfer?.files;
              if (!files || files.length === 0) {
                return;
              }

              const hasImage = Array.from(files).some((file) => file.type?.startsWith('image/'));
              if (hasImage) {
                event.preventDefault();
              }
            });

            host.addEventListener('drop', (event: DragEvent) => {
              const files = event.dataTransfer?.files;
              if (!files || files.length === 0) {
                return;
              }

              const hasImage = Array.from(files).some((file) => file.type?.startsWith('image/'));
              if (!hasImage) {
                return;
              }

              event.preventDefault();
              void component.insertImagesFromFiles(this, files);
            });

            host.addEventListener('paste', (event: ClipboardEvent) => {
              const files = event.clipboardData?.files;
              if (!files || files.length === 0) {
                // HTML olarak gelen data:image iceriklerini sonradan URL ile degistir.
                if (component.canUploadByContext()) {
                  setTimeout(() => {
                    void component.replaceBase64ImagesWithUploadedUrls(this);
                  }, 0);
                }
                return;
              }

              const hasImage = Array.from(files).some((file) => file.type?.startsWith('image/'));
              if (!hasImage) {
                if (component.canUploadByContext()) {
                  setTimeout(() => {
                    void component.replaceBase64ImagesWithUploadedUrls(this);
                  }, 0);
                }
                return;
              }

              event.preventDefault();
              void component.insertImagesFromFiles(this, files);
            });

            // Mevcut kayıtta bare dosyaKey varsa editörde tam URL olarak genişlet.
            // Control değeri değişmez (emitModelToViewChange: false ile zaten strip edilir).
            const initControl = component.nameOfFormGroup.get(component.controlName);
            const initValue: string = initControl?.value ?? '';
            if (initValue) {
              const expanded = component.expandKeysInHtmlForEditor(initValue);
              if (expanded !== initValue) {
                this.html.set(expanded);
              }
            }
          },
          'image.beforeUpload': function (this: any, images: File[]) {
            void component.insertImagesFromFiles(this, images);
            return false;
          },
          'image.beforePasteUpload': function (this: any, images: File[]) {
            void component.insertImagesFromFiles(this, images);
            return false;
          },
          'contentChanged': function (this: any) {
            if (component.canUploadByContext() && !component.isDegerlendirmeUploadContext()) {
              void component.replaceBase64ImagesWithUploadedUrls(this);
            }
          },
        },

        toolbarButtons: defaultToolbarButtons,
        toolbarButtonsMD: defaultToolbarButtons,
        toolbarButtonsSM: defaultToolbarButtons,
        toolbarButtonsXS: defaultToolbarButtons,
      };
}
  errors: AllValidationErrors[] = [];
  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngOnDestroy(): void {
    this.subscriptions.forEach((sb) => sb.unsubscribe());
  }

  getFormControlValidationErrors(errorName: string) {
    return this.formValidationService
      .getFormControlValidationErrors(
        this.nameOfFormGroup.controls,
        this.controlName
      )
      .find((x: any) => x.error_name === errorName);
  }
}
