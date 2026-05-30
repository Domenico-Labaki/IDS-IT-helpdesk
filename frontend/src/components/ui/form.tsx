"use client";

import * as React from "react";
import { Controller, FormProvider, useFormContext, useFormState, type ControllerProps, type FieldPath, type FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";

const Form = FormProvider;
const FormFieldContext = React.createContext<{ name: string } | null>(null);

function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: ControllerProps<TFieldValues, TName>
) {
  return <FormFieldContext.Provider value={{ name: props.name }}><Controller {...props} /></FormFieldContext.Provider>;
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="form-item" className={cn("space-y-2", className)} {...props} />;
}

function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const field = React.useContext(FormFieldContext);
  const { control } = useFormContext();
  const { errors } = useFormState({ control, name: field?.name });
  const error = field ? (errors[field.name as keyof typeof errors]?.message as string | undefined) : undefined;

  if (!children && !error) return null;

  return (
    <p data-slot="form-message" className={cn("text-sm font-medium text-destructive", className)} {...props}>
      {children ?? error}
    </p>
  );
}

export { Form, FormField, FormItem, FormMessage };