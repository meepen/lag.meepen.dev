import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validates that two ISO8601 date string properties (`from` and `to`) exist on the object,
 * are valid dates, and that from < to.
 * Usage: @IsValidDateRange('from','to') on a DTO property (commonly placed on `to`).
 */
export function IsValidDateRange(fromKey: string, toKey: string, validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'IsValidDateRange',
      target: object.constructor,
      propertyName,
      constraints: [fromKey, toKey],
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const [fromProp, toProp] = args.constraints;
          const fromVal = (args.object as any)[fromProp];
          const toVal = (args.object as any)[toProp];
          if (typeof fromVal !== 'string' || typeof toVal !== 'string') {
            return false;
          }
          const fromDate = new Date(fromVal);
          const toDate = new Date(toVal);
          if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return false;
          }
          return fromDate < toDate;
        },
        defaultMessage(args: ValidationArguments) {
          const [fromProp, toProp] = args.constraints;
          return `${fromProp} and ${toProp} must be valid ISO dates and ${fromProp} must be earlier than ${toProp}`;
        },
      },
    });
  };
}
