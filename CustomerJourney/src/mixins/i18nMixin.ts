import { I18N, createLogger } from "@uuip/unified-ui-platform-sdk";
import { i18nService } from "../i18n/i18n-service";
import LanguageDetector from "i18next-browser-languagedetector";

const logger = createLogger("[JDS i18n]");
const i18n = i18nService();

const init = () => {
  // Bind events
  i18n.on("failedLoading", (lng, ns, msg) => logger.info("i18n resource bundle loading failed:", lng, ns, msg));

  i18n.on("initialized", () => logger.info("i18n resource bundle initialized"));

  i18n.on("languageChanged", lng => {
    logger.info("i18n resource bundle changed browsers language:", lng);
  });

  // Init Info
  logger.info("i18n resource bundle initializing with options:", i18n.DEFAULT_INIT_OPTIONS);

  //Init
  i18n
    .use(LanguageDetector)
    .init(i18n.DEFAULT_INIT_OPTIONS)
    .catch(err => logger.error("event=I18NLoadFailure | loading of i18n resource bundle failed", err));
};
init();

export const i18nMixin = I18N.createMixin({ i18n });

export function t(...args: Parameters<typeof i18n.t>) {
  // Testing
  if (process.env.NODE_ENV === "test") {
    return (args && args.length ? (Array.isArray(args[0]) ? args[0].join("") : args[0]) : "") as string;
  }

  return i18n.t(...args);
}
