import { I18N } from "@uuip/unified-ui-platform-sdk";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

//'cimode' the output text will be the key. (for testing)
// const lng = process.env.NODE_ENV !== "test" ? undefined : "cimode";

export const I18N_DEFAULT_INIT_OPTIONS: I18N.InitOptions = {
  fallbackLng: "en",
  debug: true,
  resources: {
    en: {
      translation: en,
    },
    fr: {
      translation: fr,
    },
  },
  detection: {
    order: ["navigator", "cookie", "queryString", "localStorage", "sessionStorage", "htmlTag", "path", "subdomain"],
    lookupQuerystring: "lng",
    lookupCookie: "lng",
    lookupLocalStorage: "lng",
    lookupSessionStorage: "lng",
    lookupFromPathIndex: 0,
    lookupFromSubdomainIndex: 0,
  },
};

// agent desktop configuration
// export const I18N_DEFAULT_INIT_OPTIONS: I18N.InitOptions = {
//   debug: false,
//   defaultNS: "app",
//   ns: ["app"],
//   fallbackLng: "en_US",
//   backend: {
//     loadPath: "/i18n/{{lng}}/{{ns}}.json",
//   },
//   detection: {
//     order: ["navigator", "cookie", "queryString", "localStorage", "sessionStorage", "htmlTag", "path", "subdomain"],
//     lookupQuerystring: "lng",
//     lookupCookie: "lng",
//     lookupLocalStorage: "lng",
//     lookupSessionStorage: "lng",
//     lookupFromPathIndex: 0,
//     lookupFromSubdomainIndex: 0,
//   },
//   lng,
// };
