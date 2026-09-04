import { computed } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';

export function createOnboardingTranslations(translation: TranslationService) {
  return {
    brandSubtitle: computed(() => translation.t('app.brand.subtitle', 'Precision Management')),
    stepLabel: computed(() => translation.t('onboarding.stepLabel', 'STEP 1 OF 3')),
    heading: computed(() => translation.t('onboarding.heading', 'Account Details')),
    subheading: computed(() =>
      translation.t('onboarding.subheading', 'Enter your basic credentials to initiate your workspace setup.'),
    ),
    fullNameLabel: computed(() => translation.t('onboarding.fullNameLabel', 'Full Name')),
    fullNamePlaceholder: computed(() => translation.t('onboarding.fullNamePlaceholder', 'Dr. Jane Doe')),
    fullNameRequired: computed(() => translation.t('onboarding.fullNameRequired', 'Full name is required.')),
    emailLabel: computed(() => translation.t('onboarding.emailLabel', 'Institutional Email')),
    emailPlaceholder: computed(() => translation.t('onboarding.emailPlaceholder', 'jane.doe@university.edu')),
    emailInvalid: computed(() => translation.t('onboarding.emailInvalid', 'Enter a valid email.')),
    departmentLabel: computed(() => translation.t('onboarding.departmentLabel', 'Department')),
    departmentPlaceholder: computed(() => translation.t('onboarding.department.placeholder', 'Select your department')),
    continueButton: computed(() => translation.t('onboarding.continueButton', 'Continue')),
    hint: computed(() =>
      translation.t(
        'onboarding.hint',
        'This is a local workspace — no account is created, no data leaves this device. You can change this later in Settings.',
      ),
    ),
    systemStatusTitle: computed(() => translation.t('onboarding.systemStatusTitle', 'System Status')),
    systemStatusBody: computed(() =>
      translation.t('onboarding.systemStatusBody', 'Environment ready for secure credential exchange.'),
    ),
    logoAlt: computed(() => translation.t('app.title', 'Physical Location Prototype')),
    dnaAriaLabel: computed(() => translation.t('onboarding.dnaAriaLabel', 'Animated DNA double helix')),
  };
}
