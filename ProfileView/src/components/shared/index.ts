import { html } from "lit-element";
import { nothing } from "lit-html";
import { DateTime } from "luxon";
import { repeat } from "lit-html/directives/repeat";
import { ServerSentEvent } from "@/types/cjaas";

export function getTapeEventFromMessage(message: any) {
  const event: any = {};

  event.title = message.type;
  event.timestamp = DateTime.fromISO(message.time);
  // event.timestamp = new Date(message.time);
  event.id = message.id;
  if (message.person && message.person.indexOf("anon") === -1) {
    event.person = message.person;
  }

  if (message.data) {
    event.data = message.data;
  }

  return event;
}

export function readObjectRecursive(data: any): any {
  if (!data) {
    return nothing;
  } else {
    return html`
      <span class="secondary-text">{</span>
      <div class="sub-data">
        ${Object.keys(data).map((x: string) => {
          if (typeof data[x] === "string") {
            return html`
              <div class="data-row">
                <div class="property-key secondary-text">${x}:</div>
                <div class="property-value primary-text">
                  ${data[x] || "-"},
                </div>
              </div>
            `;
          } else {
            return html`
              <div class="secondary-text">${x}:</div>
              <div class="sub-data">${readObjectRecursive(data[x])}</div>
            `;
          }
        })}
      </div>
      <span class="secondary-text">}</span>
    `;
  }
}

export function getLastItem(arr: any[]) {
  return arr[Array.length - 1];
}

export function getTimeStamp(date: DateTime) {
  const now = DateTime.local();
  const diff: any = now
    .diff(date, ["days", "hours", "minutes", "seconds"])
    .toObject();

  if (diff === undefined) {
    return;
  } else {
    if (diff.days >= 30) {
      return `${date.toFormat("dd")}/${date.toFormat("MM")}`;
    } else if (diff.days >= 1 && diff.days < 30) {
      return `${Math.floor(diff.days)}d`;
    } else if (diff.hours >= 1) {
      return `${Math.floor(diff.hours)}h`;
    } else if (diff.minutes >= 1) {
      return `${Math.floor(diff.minutes)}m`;
    } else if (diff.seconds >= 1) {
      return `${Math.floor(diff.seconds)}s`;
    } else {
      return "now";
    }
  }
}

export function getRelativeDate(timestamp: string) {
  const dt = DateTime.local();
  const nowIsoString = dt.toISO();

  const relativeValue = DateTime.fromISO(
    timestamp || nowIsoString
  ).toRelativeCalendar();
  return relativeValue;
}

export function getBulletAsTapeItem(event: TapeEvent) {
  return html`
    <cjs-item
      .title=${event.title}
      .timestamp=${event.timestamp}
      .data=${event.data}
      .id=${event.id}
      .person=${event.person || null}
      class="has-line"
    ></cjs-item>
  `;
}

export function getTapeItemGroup(groupedEvent: {
  key: string;
  children: TapeEvent[];
}) {
  return html`
    <div class="tape-group has-line">
      <md-badge .outlined=${true} class="has-line block">
        <span class="badge-text">${groupedEvent.key}</span>
      </md-badge>
      ${repeat(
        groupedEvent.children,
        (event: TapeEvent) => event.id,
        (event: TapeEvent) => getBulletAsTapeItem(event)
      )}
    </div>
  `;
}

export const EVENT_ICON_MAP: any = {
  "Page Visit": {
    name: "icon-open-pages_16",
    color: "purple"
  },
  Identify: {
    name: "icon-user_16",
    color: "blue"
  },
  "NPS.*": {
    name: "icon-analysis_16",
    color: "red"
  },
};

const TEMP_ICON_MAP: any = {};

const staticColors = [
  "purple",
  "mint",
  "slate",
  "gold",
  "lime",
  "darkmint",
  "green",
  "yellow",
  "red",
  "orange",
  "violet",
  "cyan",
  "cobalt",
  "pink"
];

const staticIcons = [
  "icon-apps_16",
  "icon-activities_16",
  "icon-breakout-session_16",
  "icon-commenting_16",
  "icon-explore_16",
  "icon-filter-circle_16"
];

function getRandomColor() {
  return staticColors[Math.floor(Math.random() * staticColors.length)];
}
function getRandomIcon() {
  return staticIcons[Math.floor(Math.random() * staticIcons.length)];
}

// uses known event types and also generates random pairs for unknown events
export function getIconData(eventName: string) {
  let result: any;

  Object.keys(EVENT_ICON_MAP).forEach((x: string) => {
    const regex = new RegExp(x);

    if (regex.test(eventName)) {
      result = EVENT_ICON_MAP[x];
    }
  });

  if (!result && !TEMP_ICON_MAP[eventName]) {
    result = {
      name: getRandomIcon(),
      color: getRandomColor()
    };

    TEMP_ICON_MAP[eventName] = result;
  } else if (!result && TEMP_ICON_MAP[eventName]) {
    result = TEMP_ICON_MAP[eventName];
  }

  return result;
}

export function linearFormat(data: any) {
  if (!data) {
    return "";
  }
  return JSON.stringify(data)
    .replace(/"/g, "")
    .replace(/{/g, "{ ")
    .replace(/}/g, " }")
    .replace(/,/g, ", ")
    .replace(/:/g, " : ")
    .replace(/https : /g, "https:");
}
