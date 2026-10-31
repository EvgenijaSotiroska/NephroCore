// Placeholders until the nephrologist confirms the values.

// The most readings a patient can enter for one day (the server enforces the same limit).
export const BP_MAX_READINGS_PER_DAY = 3;

// A reading above either value is marked as above target.
export const BP_TARGET_SYSTOLIC = 130;
export const BP_TARGET_DIASTOLIC = 85;

// A reading at or above either value shows the patient a warning to contact the doctor.
export const BP_ALERT_SYSTOLIC = 180;
export const BP_ALERT_DIASTOLIC = 120;

export const isAboveTarget = (systolic: number, diastolic: number) =>
  systolic > BP_TARGET_SYSTOLIC || diastolic > BP_TARGET_DIASTOLIC;

export const isAlertLevel = (systolic: number, diastolic: number) =>
  systolic >= BP_ALERT_SYSTOLIC || diastolic >= BP_ALERT_DIASTOLIC;
