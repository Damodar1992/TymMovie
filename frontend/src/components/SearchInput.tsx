import { useEffect, useState } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const [internal, setInternal] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      onChange(internal);
    }, 300);
    return () => clearTimeout(id);
  }, [internal, onChange]);

  return (
    <input
      className="search-input"
      type="search"
      placeholder="Search by title"
      value={internal}
      onChange={(e) => setInternal(e.target.value)}
    />
  );
}

