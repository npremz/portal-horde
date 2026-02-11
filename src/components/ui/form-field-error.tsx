interface FormFieldErrorProps {
  id?: string;
  error?: string;
}

export function FormFieldError({ id, error }: FormFieldErrorProps) {
  if (!error) return null;
  return (
    <p id={id} className="text-xs text-destructive mt-1" role="alert">
      {error}
    </p>
  );
}
