interface FormFieldErrorProps {
  error?: string;
}

export function FormFieldError({ error }: FormFieldErrorProps) {
  if (!error) return null;
  return (
    <p className="text-xs text-destructive mt-1" role="alert">
      {error}
    </p>
  );
}
