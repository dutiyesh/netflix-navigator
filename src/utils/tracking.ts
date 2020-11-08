import debounce from "./debounce";

interface TrackingData {
  category: string;
  action: string;
  label: string;
}

function sendTrackingData(data: TrackingData[]) {
  chrome.runtime.sendMessage({
    type: "TRACK",
    payload: {
      data,
    },
  });
}

let TRACK_MAP: TrackingData[] = [];

const sendTrackingDataDebounce = debounce(sendTrackingData, 500, () => {
  TRACK_MAP = [];
});

export function trackEvent(category: string, action: string, label = ""): void {
  TRACK_MAP.push({
    category,
    action,
    label,
  });

  if (typeof (chrome as any).app.isInstalled !== "undefined") {
    sendTrackingDataDebounce(TRACK_MAP);
  }
}
