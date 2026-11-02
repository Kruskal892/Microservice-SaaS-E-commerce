import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

export function zodResolver<T extends FieldValues>(
  schema: z.ZodType<T>,
): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors: FieldErrors<T> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof T | undefined;
      if (key && !errors[key]) {
        errors[key] = {
          type: issue.code,
          message: issue.message,
        } as FieldErrors<T>[keyof T];
      }
    }

    return { values: {}, errors };
  };
}

