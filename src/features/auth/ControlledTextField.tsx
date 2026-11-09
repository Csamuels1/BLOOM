import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { TextField, type TextFieldProps } from '@/components';

type ControlledTextFieldProps<T extends FieldValues> = Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'onBlur'
> & {
  control: Control<T>;
  name: FieldPath<T>;
};

/** Binds a react-hook-form field to the accessible TextField (issue #10). */
export function ControlledTextField<T extends FieldValues>({
  control,
  name,
  ...fieldProps
}: ControlledTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          value={field.value as string}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          {...fieldProps}
        />
      )}
    />
  );
}

export default ControlledTextField;
