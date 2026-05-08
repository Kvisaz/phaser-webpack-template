export function getHhMmSs(ms: number, options?: { alwaysShowHours?: boolean }): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0 || options?.alwaysShowHours ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}
