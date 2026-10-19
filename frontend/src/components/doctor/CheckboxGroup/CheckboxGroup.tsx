import type { CheckboxOption } from "../../../constants";
import "./CheckboxGroup.css";

interface CheckboxGroupProps {
  title: string;
  options: CheckboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export default function CheckboxGroup({
  title,
  options,
  selectedValues,
  onChange,
}: CheckboxGroupProps) {
  function handleChange(value: string) {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  }

  return (
    <div className="checkbox-group">
      <label className="checkbox-group-title">{title}</label>

      <div className="checkbox-grid">
        {options.map((option) => {
          const checked = selectedValues.includes(option.value);

          return (
            <label
              key={option.value}
              className={`checkbox-option ${
                checked ? "checkbox-option-selected" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleChange(option.value)}
              />

              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
