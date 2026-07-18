/** Whether a horizontal scroller can move left / right. */
export function scrollEdges(scrollLeft: number, clientWidth: number, scrollWidth: number) {
  return {
    canL: scrollLeft > 2,
    canR: scrollLeft + clientWidth < scrollWidth - 2,
  }
}
