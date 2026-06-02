import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MetaService {

  constructor(
    private titleService: Title,
    private metaService: Meta
  ) {}

  /**
   * Sayfa başlığını ve meta bilgilerini ayarla
   */
  setPageMeta(pageTitle?: string): void {
    // Title ayarla - sayfa title varsa environment title'a ekle
    const title = pageTitle 
      ? `${pageTitle} - ${environment.meta.title}`
      : environment.meta.title;
    
    this.titleService.setTitle(title);

    // Meta description güncelle
    this.metaService.updateTag({ 
      name: 'description', 
      content: environment.meta.description 
    });

    // Meta keywords güncelle
    this.metaService.updateTag({ 
      name: 'keywords', 
      content: environment.meta.keywords 
    });

    // Open Graph tags ekle
    this.metaService.updateTag({ 
      property: 'og:title', 
      content: title 
    });

    this.metaService.updateTag({ 
      property: 'og:description', 
      content: environment.meta.description 
    });

    this.metaService.updateTag({ 
      property: 'og:type', 
      content: 'website' 
    });

    // Twitter Card tags ekle
    this.metaService.updateTag({ 
      name: 'twitter:card', 
      content: 'summary' 
    });

    this.metaService.updateTag({ 
      name: 'twitter:title', 
      content: title 
    });

    this.metaService.updateTag({ 
      name: 'twitter:description', 
      content: environment.meta.description 
    });
  }

  /**
   * Dinamik sayfa title'ı ayarla
   */
  setPageTitle(title: string): void {
    this.setPageMeta(title);
  }

  /**
   * Environment bilgilerini al
   */
  getEnvironmentInfo() {
    return {
      title: environment.meta.title,
      description: environment.meta.description,
      keywords: environment.meta.keywords,
      appName: environment.appName,
      version: environment.version,
      environment: environment.production ? 'production' : 
                  environment.test ? 'test' : 'development'
    };
  }
}
