import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // provideZoneChangeDetection({ eventCoalescing: true }),
    provideZonelessChangeDetection(),
    // provideExperimentalCheckNoChangesForDebug({
    //   interval: 1000, // run change detection every second
    //   useNgZoneOnStable: true, // run it when the NgZone is stable as well
    //   exhaustive: true, // check all components
    // }),
  ],
};
