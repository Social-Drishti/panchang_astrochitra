// Remembers the last visited page so a cold PWA launch (Android kills the app,
// user taps the installed icon) resumes where they left off instead of Home.
//
// Reads are synchronous on purpose: the boot redirect in App.tsx runs during
// the first render, and an async read would flash Home before jumping.
const STORAGE_KEY = 'panchang:lastPath';

export function readLastPath(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeLastPath(path: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, path);
  } catch {
    /* storage unavailable (private mode / quota); in-session nav still works */
  }
}
