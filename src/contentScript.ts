"use strict";

import tinykeys from "tinykeys";

import NetflixNavigator from "./navigator";
import { trackEvent } from "./utils/tracking";
import "./contentScript.css";

const netflixNavigator = new NetflixNavigator();

tinykeys(window, {
  ArrowDown: function (event: KeyboardEvent) {
    event.preventDefault();

    netflixNavigator.focusRow("down");
    trackEvent("arrow", "click", "down");
  },

  ArrowUp: function (event: KeyboardEvent) {
    event.preventDefault();

    netflixNavigator.focusRow("up");
    trackEvent("arrow", "click", "up");
  },

  ArrowRight: function (event) {
    event.preventDefault();

    netflixNavigator.navigateSlider("right");
    trackEvent("arrow", "click", "right");
  },

  ArrowLeft: function (event) {
    event.preventDefault();

    netflixNavigator.navigateSlider("left");
    trackEvent("arrow", "click", "left");
  },

  S: function () {
    netflixNavigator.openSearch();
    trackEvent("search", "click");
  },

  Enter: function () {
    if (netflixNavigator.isSliderItemInFocus()) {
      trackEvent("detail-modal", "click");
    }
  },
});

window.addEventListener("load", () => {
  trackEvent("content-page", "view");
});
