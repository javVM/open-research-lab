export const ONBOARDING_STEP_LABEL = 'STEP 1 OF 3' as const;

export const ONBOARDING_DEPARTMENT_OPTIONS = [
  { value: '', labelKey: 'onboarding.department.placeholder', fallback: 'Select your department' },
  { value: 'natural_history', labelKey: 'onboarding.department.naturalHistory', fallback: 'Natural History' },
  { value: 'paleontology', labelKey: 'onboarding.department.paleontology', fallback: 'Paleontology' },
  { value: 'geology', labelKey: 'onboarding.department.geology', fallback: 'Geology' },
  { value: 'botany', labelKey: 'onboarding.department.botany', fallback: 'Botany' },
  { value: 'zoology', labelKey: 'onboarding.department.zoology', fallback: 'Zoology' },
  { value: 'molecular', labelKey: 'onboarding.department.molecular', fallback: 'Molecular / Genetics' },
  { value: 'archaeology', labelKey: 'onboarding.department.archaeology', fallback: 'Archaeology' },
  { value: 'other', labelKey: 'onboarding.department.other', fallback: 'Other' },
] as const;

export const DNA_RUNG_COUNT = 18 as const;
