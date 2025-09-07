import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    // Zoneless is enabled by default when Zone.js is not imported.
  ],
}).catch((err) => console.error(err));
