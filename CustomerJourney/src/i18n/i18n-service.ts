import { I18N } from "@uuip/unified-ui-platform-sdk";
// import { logger } from "../../core/sdk";
import { I18N_DEFAULT_INIT_OPTIONS } from "./i18n-default-init-options";

export function i18nService() {
  //   const i18n = I18N.createService({ logger });
  const i18n = I18N.createService();

  const result = Object.assign(i18n, {
    get DEFAULT_INIT_OPTIONS() {
      return JSON.parse(JSON.stringify(I18N_DEFAULT_INIT_OPTIONS)) as I18N.InitOptions;
    },
  });

  console.log("i18nService (i18n)", i18n);
  console.log("i18nService (return value)", result);

  return result;
}
