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
    trackEvent("arrow_click", "content_script", {
      event_arrow_key: "down",
    });
  },

  ArrowUp: function (event: KeyboardEvent) {
    event.preventDefault();

    netflixNavigator.focusRow("up");
    trackEvent("arrow_click", "content_script", {
      event_arrow_key: "up",
    });
  },

  ArrowRight: function (event) {
    event.preventDefault();

    netflixNavigator.navigateSlider("right");
    trackEvent("arrow_click", "content_script", {
      event_arrow_key: "right",
    });
  },

  ArrowLeft: function (event) {
    event.preventDefault();

    netflixNavigator.navigateSlider("left");
    trackEvent("arrow_click", "content_script", {
      event_arrow_key: "left",
    });
  },

  S: function () {
    netflixNavigator.openSearch();
    trackEvent("search_click", "content_script");
  },

  Enter: function () {
    if (netflixNavigator.isSliderItemInFocus()) {
      trackEvent("detail_modal_click", "content_script");
    }
  },
});

window.addEventListener("load", () => {
  trackEvent("content_page_load", "content_script");
});
