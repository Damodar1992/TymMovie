import { isoToDmy } from '../lib/watchDate';

interface FormattedDatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  className?: string;
}

export function FormattedDatePicker({ value, onChange, className }: FormattedDatePickerProps) {
  const display = value ? isoToDmy(value) : 'DD.MM.YYYY';

  return (
    <label className={`formatted-date-picker${className ? ` ${className}` : ''}`}>
      <span
        className={`formatted-date-picker-value${value ? '' : ' is-placeholder'}`}
        aria-hidden="true"
      >
        {display}
      </span>
      <input
        type="date"
        className="formatted-date-picker-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        lang="uk-UA"
      />
    </label>
  );
}
