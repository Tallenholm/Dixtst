import logger from '../../logger.ts';

export function isHueApiError(err: unknown): err is Error & { getHueErrorType(): number } {
  return err instanceof Error && typeof (err as any).getHueErrorType === 'function';
}

export function logError(context: string, err: unknown): void {
  if (isHueApiError(err)) {
    logger.error(context, { hueErrorType: err.getHueErrorType(), message: err.message });
  } else if (err instanceof Error) {
    logger.error(context, { message: err.message });
  } else {
    logger.error(context, err);
  }
}
