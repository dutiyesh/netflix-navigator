import debounce from "./debounce";

interface TrackingData {
  name: string;
  category: string;
  params?: object | null;
}

const SESSION_ID = String(Math.floor(new Date().getTime() / 1000));

function getUserLang(): string {
  const header = document.getElementsByClassName("pinning-header")[0];

  if (header) {
    const container = header.closest("div[lang]");

    if (container) {
      return container.getAttribute("lang") || "none";
    }
  }

  return document.documentElement.getAttribute("lang") || "none";
}

function sendTrackingData(data: TrackingData[]) {
  chrome.runtime.sendMessage({
    type: "TRACK",
    payload: {
      data,
      commonData: {
        session_id: SESSION_ID,
        event_user_lang: getUserLang(),
        event_useragent: window.navigator.userAgent,
      },
    },
  });
}

let TRACK_MAP: TrackingData[] = [];

const sendTrackingDataDebounce = debounce(sendTrackingData, 500, () => {
  TRACK_MAP = [];
});

export function trackEvent(
  name: string,
  category: string,
  params?: object
): void {
  TRACK_MAP.push({
    name,
    category,
    params: params || null,
  });

  sendTrackingDataDebounce(TRACK_MAP);
}
