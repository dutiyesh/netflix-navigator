"use strict";

import { trackEvent } from "./utils/tracking";
import "./popup.css";

function handleElementClick(event: Event): void {
  const element = event.currentTarget as HTMLElement;

  chrome.tabs.create({
    active: true,
    url: element.dataset.href,
  });
}

function setupClickableElements() {
  const clickableElements = document.getElementsByClassName("js-clickable");

  for (let i = 0; i < clickableElements.length; i++) {
    clickableElements[i].addEventListener("click", (event) => {
      handleElementClick(event);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupClickableElements();
  trackEvent("popup", "view");
});
