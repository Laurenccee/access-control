import { Search } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

export default function UserSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field>
      <FieldLabel className="uppercase text-xs tracking-[0.2em] text-muted-foreground ml-1">
        Search Users
      </FieldLabel>
      <InputGroup className="focus-within:ring-1 focus-within:ring-ring/50">
        <InputGroupInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="text-sm"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>
            <Search size={18} strokeWidth={1.5} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
