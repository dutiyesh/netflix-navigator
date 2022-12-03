"use strict";

import storage from "./utils/storage";

function generateCId(): string {
  const cid =
    Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000;
  const time = Math.floor(new Date().getTime() / 1000);
  const uid = `${cid}.${time}`;

  return uid;
}

async function getCId(): Promise<string> {
  const result = await storage.get(["cid"]);

  if (typeof result.cid === "undefined") {
    const cid = generateCId();

    await storage.set("cid", cid);
    return cid;
  } else {
    return result.cid;
  }
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "TRACK") {
    const { data, commonData } = request.payload;

    getCId().then((cid) => {
      const uid = cid.split(".")[0];

      const eventData = data.map((d: any) => {
        return {
          name: d.name,
          params: {
            ...d.params,
            ...commonData,
            event_category: d.category,
            event_environment:
              process.env.NODE_ENV !== "production"
                ? "development"
                : "production",
            event_timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone || "timezone",
            user_id: uid,
            engagement_time_msec: "100",
          },
        };
      });

      fetch(
        "https://www.google-analytics.com/mp/collect?measurement_id=G-C4E8JBRFDF&api_secret=nrA3ydtxQXuksehZynyN5w",
        {
          method: "POST",
          mode: "no-cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          referrerPolicy: "no-referrer",
          body: JSON.stringify({
            client_id: cid,
            user_id: uid,
            events: eventData,
          }),
        }
      );
    });

    return true;
  }
});

chrome.runtime.setUninstallURL("https://forms.gle/8y4ysjeZx1Uu7Uxp8");
