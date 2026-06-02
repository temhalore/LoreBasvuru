import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MetaService } from './core/services/meta.service';
import { DynamicNavigationService } from './core/services/navigation.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet],
})
export class AppComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(
        private metaService: MetaService,
        private dynamicNavigationService: DynamicNavigationService
    ) {}

    /**
     * On init
     */
    ngOnInit(): void {
        // Uygulama başlatıldığında meta bilgilerini ayarla
        this.metaService.setPageMeta();
        
        // Environment bilgilerini console'da göster (development ortamında)
        const envInfo = this.metaService.getEnvironmentInfo();
        if (envInfo.environment !== 'production') {
        }
    }
}
