// React resets every uncontrolled field in the <form> once the action
// settles, error or not — snapshot the raw values beforehand and, on
// error, write them straight back so a failed submit doesn't wipe what
// was typed into every card. The reset isn't synchronous with the action
// promise settling, so a one-shot restore can lose the race — reassert
// for a few frames instead of guessing the exact timing.
export function restoreFormValues(values: [string, string][], framesLeft = 12) {
  for (const [name, value] of values) {
    const el = document.querySelector<HTMLInputElement>(
      `[name="${CSS.escape(name)}"]`,
    );
    if (el && el.type !== "hidden" && el.value !== value) el.value = value;
  }
  if (framesLeft > 0)
    requestAnimationFrame(() => restoreFormValues(values, framesLeft - 1));
}
