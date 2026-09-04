import { computed } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';

export function createOnboardingTranslations(translation: TranslationService) {
  return {
    brandSubtitle: computed(() => translation.t('app.brand.subtitle', 'Precision Management')),
    stepLabel: computed(() => translation.t('onboarding.stepLabel', 'STEP {current} OF 3')),
    headingStep1: computed(() => translation.t('onboarding.heading.step1', 'Account Details')),
    headingStep2: computed(() => translation.t('onboarding.heading.step2', 'Workspace')),
    headingStep3: computed(() => translation.t('onboarding.heading.step3', 'Ready to start')),
    subheadingStep1: computed(() =>
      translation.t('onboarding.subheading.step1', 'Enter your basic credentials to initiate your workspace setup.'),
    ),
    subheadingStep2: computed(() =>
      translation.t(
        'onboarding.subheading.step2',
        'Name your collection and how new items will be catalogued.',
      ),
    ),
    subheadingStep3: computed(() =>
      translation.t('onboarding.subheading.step3', 'Everything stays on this device. You can change these in Settings.'),
    ),
    firstNameLabel: computed(() => translation.t('onboarding.firstNameLabel', 'Name')),
    firstNamePlaceholder: computed(() => translation.t('onboarding.firstNamePlaceholder', 'Jane')),
    lastNameLabel: computed(() => translation.t('onboarding.lastNameLabel', 'Last Name')),
    lastNamePlaceholder: computed(() => translation.t('onboarding.lastNamePlaceholder', 'Doe')),
    requiredField: computed(() => translation.t('onboarding.requiredField', 'This field is required.')),
    emailLabel: computed(() => translation.t('onboarding.emailLabel', 'Institutional Email')),
    emailPlaceholder: computed(() => translation.t('onboarding.emailPlaceholder', 'jane.doe@university.edu')),
    emailInvalid: computed(() => translation.t('onboarding.emailInvalid', 'Enter a valid email.')),
    departmentLabel: computed(() => translation.t('onboarding.departmentLabel', 'Department')),
    departmentPlaceholder: computed(() => translation.t('onboarding.department.placeholder', 'Select your department')),
    institutionLabel: computed(() => translation.t('onboarding.institutionLabel', 'Collection / Institution name')),
    institutionPlaceholder: computed(() => translation.t('onboarding.institutionPlaceholder', 'MNCN — Invertebrates')),
    prefixLabel: computed(() => translation.t('onboarding.prefixLabel', 'Default catalogue prefix')),
    prefixHint: computed(() => translation.t('onboarding.prefixHint', 'Used when creating new items, e.g. ITEM-0001')),
    continueButton: computed(() => translation.t('onboarding.continueButton', 'Continue')),
    backButton: computed(() => translation.t('onboarding.backButton', 'Back')),
    startButton: computed(() => translation.t('onboarding.startButton', 'Start exploring')),
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
