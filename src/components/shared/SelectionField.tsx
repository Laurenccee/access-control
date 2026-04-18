import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
} from 'react-hook-form';
import { Field, FieldDescription, FieldLabel } from '../ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectionFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  isPending?: boolean;
  description?: string;
  options: { value: string; label: string }[];
  transform?: (value: string) => PathValue<T, Path<T>>; // ← tied to actual field type
}

export default function SelectionField<T extends FieldValues>({
  name,
  label,
  control,
  isPending = false,
  options,
  description,
  transform,
}: SelectionFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel
            className="uppercase text-xs tracking-[0.2em] text-muted-foreground ml-1"
            htmlFor={field.name}
          >
            {label}
          </FieldLabel>
          <Select
            value={field.value !== undefined ? String(field.value) : ''}
            onValueChange={(val) =>
              field.onChange(transform ? transform(val) : val)
            }
            disabled={isPending}
          >
            <SelectTrigger className="w-45">
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldDescription className="text-[10px] tracking-[0.2em] text-muted-foreground ml-1">
            {fieldState.error?.message ?? ''}
          </FieldDescription>
          {description && !fieldState.error && (
            <FieldDescription className="text-[10px] tracking-[0.2em] text-muted-foreground ml-1">
              {description}
            </FieldDescription>
          )}
        </Field>
      )}
    />
  );
}
