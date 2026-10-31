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

export const COMORBIDITIES: CheckboxOption[] = [
  { value: "type_1_diabetes", label: "Дијабетес тип 1" },
  { value: "type_2_diabetes", label: "Дијабетес тип 2" },
  { value: "hypertension", label: "Хипертензија" },
  { value: "anemia", label: "Анемија" },
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