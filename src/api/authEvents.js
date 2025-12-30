export const AUTH_EVENTS = {
  UNAUTHORIZED: "unauthorized",
};

let isLoggingOut = false;

export function emitUnauthorized() {
  if (isLoggingOut) return;
  isLoggingOut = true;

  window.dispatchEvent(new Event(AUTH_EVENTS.UNAUTHORIZED));
}

export function resetUnauthorized() {
  isLoggingOut = false;
}
