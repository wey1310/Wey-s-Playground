export const safeConfirm = (msg: string): boolean => {
  try {
    return window.confirm(msg);
  } catch (e) {
    console.warn('confirm() blocked by iframe, auto-confirming.');
    return true;
  }
};

export const safeAlert = (msg: string): void => {
  try {
    window.alert(msg);
  } catch (e) {
    console.warn('alert() blocked by iframe:', msg);
  }
};
