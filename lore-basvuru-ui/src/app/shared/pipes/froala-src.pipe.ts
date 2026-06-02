import { Pipe, PipeTransform } from '@angular/core';
import { environment } from 'environments/environment';

/**
 * FroalaSrcPipe — Froala editöründe saklanan içerikleri görüntülerken img src değerlerini dönüştürür.
 *
 * Davranış:
 *  - http:// veya https:// ile başlayan src → değişmez (harici URL)
 *  - data:image/ ile başlayan src → değişmez (base64, yükleme başarısız olmuş fallback durum)
 *  - Diğer her şey → dosyaKey olarak kabul edilir →
 *    {apiUrl}Common/File/GetDosyaByKey?dosyaKey={src} ile değiştirilir
 *
 * Kullanım:
 *   <div [froalaView]="content | froalaSrc"></div>
 */
@Pipe({
  name: 'froalaSrc',
  standalone: true,
  pure: true
})
export class FroalaSrcPipe implements PipeTransform {
  private readonly getByKeyUrl = `${environment.apiUrl}Common/File/GetDosyaByKey?dosyaKey=`;

  transform(htmlContent: string | null | undefined): string {
    if (!htmlContent) {
      return htmlContent ?? '';
    }

    // img src attribute'larını yakala (tek ve çift tırnak, boşluklu yazım)
    return htmlContent.replace(
      /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi,
      (_match, before, src, after) => {
        const trimmedSrc = src.trim();

        // Harici URL veya base64 ise dokunma
        if (
          trimmedSrc.startsWith('http://') ||
          trimmedSrc.startsWith('https://') ||
          trimmedSrc.startsWith('data:image/')
        ) {
          return `${before}${src}${after}`;
        }

        // dosyaKey → GetDosyaByKey endpoint'ine yönlendir
        return `${before}${this.getByKeyUrl}${encodeURIComponent(trimmedSrc)}${after}`;
      }
    );
  }
}
