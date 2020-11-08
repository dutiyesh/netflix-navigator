// Credit: Jakub Chodorowicz
// Source: https://github.com/chodorowicz/ts-debounce/blob/master/src/index.ts

export type Procedure = (...args: any[]) => void;

export default function debounce<F extends Procedure>(
  func: F,
  wait = 200,
  onComplete: F
): (this: ThisParameterType<F>, ...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    const context = this;

    let later = function () {
      timeoutId = undefined;

      func.apply(context, args);
      onComplete();
    };

    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);
  };
}
