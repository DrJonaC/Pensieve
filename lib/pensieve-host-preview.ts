export const HOST_CAPTURE_REFRESH_INTERVAL = 500;
export const HOST_CAPTURE_LIMIT = 1024;

export function shouldRefreshCaptureDisplay(
  eventCount: number,
  interval = HOST_CAPTURE_REFRESH_INTERVAL,
  limit = HOST_CAPTURE_LIMIT
): boolean {
  if (eventCount <= 0) {
    return false;
  }

  return eventCount >= limit || eventCount % interval === 0;
}
