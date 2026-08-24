import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
import '@testing-library/jest-dom';

// This app uses Angular's zoneless change detection (no zone.js dependency),
// so the test environment must be initialised the same way.
setupZonelessTestEnv();
