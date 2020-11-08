"use strict";

interface Window {
  _gaq: any;
}

let pendingTrackingData = [
  ["_setAccount", "UA-182345827-1"],
  ["_trackPageview"],
];

(function () {
  var ga = document.createElement("script");
  ga.type = "text/javascript";
  ga.async = true;
  ga.src = "https://ssl.google-analytics.com/ga.js";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode!.insertBefore(ga, s);
})();

interface TrackingData {
  category: string;
  action: string;
  label: string;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "TRACK") {
    const { data } = request.payload;

    if (typeof window._gaq !== "undefined") {
      if (pendingTrackingData.length !== 0) {
        pendingTrackingData.forEach((data: string[]) => {
          window._gaq.push(data);
        });

        pendingTrackingData = [];
      }

      data.forEach((d: TrackingData) => {
        window._gaq.push(["_trackEvent", d.category, d.action, d.label]);
      });
    } else {
      data.forEach((d: TrackingData) => {
        pendingTrackingData.push([
          "_trackEvent",
          d.category,
          d.action,
          d.label,
        ]);
      });
    }
  }
});

chrome.runtime.setUninstallURL("https://forms.gle/8y4ysjeZx1Uu7Uxp8");
