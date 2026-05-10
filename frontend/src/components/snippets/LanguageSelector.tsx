import { LANGUAGES } from "../../utils/constants";
import { Select } from "../ui/select";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function LanguageSelector({ value, onChange }: Props) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)}>
      {LANGUAGES.map((language) => <option key={language}>{language}</option>)}
    </Select>
  );
}

