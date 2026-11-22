export const MODULES = {
  LITERATURE_SCREENING: 'literature-screening',
  INTAKE_TRIAGE: 'intake-triage',
  CASE_PROCESSING: 'case-processing',
  SUBMISSIONS: 'submissions',
  SIGNAL_MANAGEMENT: 'signal-management',
  AGGREGATE_REPORTING: 'aggregate-reporting',
  PV_DOCUMENTATION: 'pv-documentation',
} as const;

export type ModuleKey = keyof typeof MODULES;
export type ModuleId = typeof MODULES[ModuleKey];

export const PERMISSIONS = {
  SCREENING_EXECUTE: 'screening:execute',
  SCREENING_CONFIGURE: 'screening:configure',
  INTAKE_CREATE: 'intake:create',
  INTAKE_TRIAGE: 'intake:triage',
  CASE_CREATE: 'case:create',
  CASE_PROCESS: 'case:process',
  CASE_SIGN_OFF: 'case:sign_off',
  SUBMISSION_GENERATE: 'submission:generate',
  SUBMISSION_TRANSMIT: 'submission:transmit',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  TENANT_ADMIN: 'tenant_admin',
  SAFETY_SCIENTIST: 'safety_scientist',
  CASE_PROCESSOR: 'case_processor',
  MEDICAL_REVIEWER: 'medical_reviewer',
  SUBMISSION_SPECIALIST: 'submission_specialist',
  READ_ONLY: 'read_only',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
