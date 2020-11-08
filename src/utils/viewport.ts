export function isInViewport(element: Element | HTMLElement): boolean {
  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    Math.floor(rect.bottom) <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    Math.floor(rect.right) <=
      (window.innerWidth || document.documentElement.clientWidth)
  );
}
