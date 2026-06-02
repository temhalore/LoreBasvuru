import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'app/app.component';
import { appConfig } from 'app/app.config';

const { origin, pathname, search, hash } = window.location;

if (hash.startsWith('#/')) {
    const normalizedHashPath = hash.slice(1);
    window.location.replace(`${origin}${normalizedHashPath}${search}`);
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
);
