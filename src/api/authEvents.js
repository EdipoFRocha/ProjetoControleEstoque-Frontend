export const AUTH_EVENTS = {
  UNAUTHORIZED: "auth:unauthorized",
};

export function emitUnauthorized() {
  window.dispatchEvent(new Event(AUTH_EVENTS.UNAUTHORIZED));
}
