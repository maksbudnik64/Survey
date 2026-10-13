export async function withSubmitLock(
  form: HTMLFormElement,
  action: () => Promise<void>
): Promise<void> {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!button || button.disabled) return;

  button.disabled = true;
  try {
    await action();
  } finally {
    button.disabled = false;
  }
}