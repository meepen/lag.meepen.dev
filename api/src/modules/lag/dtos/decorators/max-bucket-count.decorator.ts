import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validates that the number of buckets produced by (to - from) / (bucketMinutes * 60_000)
 * is less than or equal to a specified max. Assumes from/to already validated as ISO dates and from < to.
 * Usage: @MaxBucketCount('from','to',500) on the bucketMinutes property.
 */
export function MaxBucketCount(fromKey: string, toKey: string, maxBuckets: number, validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'MaxBucketCount',
      target: object.constructor,
      propertyName,
      constraints: [fromKey, toKey, maxBuckets],
      options: validationOptions,
      validator: {
        validate(bucketMinutes: any, args: ValidationArguments) {
          if (typeof bucketMinutes !== 'number' || bucketMinutes <= 0) {
            return false;
          }
          const [fromProp, toProp, max] = args.constraints as [string, string, number];
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
          if (!(fromDate < toDate)) {
            return false; // rely on date range decorator but be defensive
          }
          const rangeMs = toDate.getTime() - fromDate.getTime();
          const bucketMs = bucketMinutes * 60_000;
          const bucketCount = Math.ceil(rangeMs / bucketMs);
          return bucketCount <= max;
        },
        defaultMessage(args: ValidationArguments) {
          const [fromProp, toProp, max] = args.constraints as [string, string, number];
          return `Bucket count derived from ${fromProp}/${toProp} must be <= ${max}; increase bucketMinutes.`;
        },
      },
    });
  };
}
