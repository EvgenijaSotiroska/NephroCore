export interface CheckboxOption {
  value: string;
  label: string;
}

export const PREVIOUS_CONDITIONS: CheckboxOption[] = [
  { value: "acute_kidney_injury", label: "Акутно оштетување на бубрезите" },
  { value: "recurrent_utis_pyelo", label: "Пиелонефритис" },
  { value: "kidney_stones", label: "Камења во бубрезите (нефролитијаза)" },
  { value: "prior_glomerulonephritis", label: "Гломерулонефритис" },
  { value: "single_kidney_nephrectomy", label: "Нефректомија" },
  { value: "cardiovascular_disease", label: "Кардиоваскуларна болест" },
];

export const GENETIC_RISK_FACTORS: CheckboxOption[] = [
  {
    value: "family_history_ckd_kidney_failure_dialysis",
    label: "Семејна историја на бубрежна болест / бубрежна слабост",
  },
  {
    value: "family_history_pckd",
    label: "Семејна историја на полицистична бубрежна болест",
  },
  { value: "family_history_diabetes", label: "Семејна историја на дијабетес" },
  { value: "family_history_hypertension", label: "Семејна историја на хипертензија" },
];

export const COMORBIDITIES: CheckboxOption[] = [
  { value: "type_1_diabetes", label: "Дијабетес тип 1" },
  { value: "type_2_diabetes", label: "Дијабетес тип 2" },
  { value: "hypertension", label: "Хипертензија" },
  { value: "obesity", label: "Дебелина" },
  { value: "anemia", label: "Анемија" },
  { value: "dyslipidemia", label: "Дислипидемија" },
];

export const CURRENT_MEDICATIONS: CheckboxOption[] = [
  { value: "ace_inhibitors_arbs", label: "ACE инхибитори / ARB" },
  { value: "diuretics", label: "Диуретици" },
  { value: "nsaids", label: "NSAID лекови" },
  {
    value: "erythropoiesis_stimulating_agents",
    label: "Стимулатори на еритропоезата (EPO)",
  },
  { value: "sglt2_inhibitors", label: "SGLT2 инхибитори" },
  { value: "metformin", label: "Метформин" },
  { value: "statins", label: "Статини" },
  { value: "immunosuppressants", label: "Имуносупресивни лекови" },
];

// Checkbox selections are stored in the database as one "|"-joined string.
export const CODED_LIST_SEPARATOR = "|";