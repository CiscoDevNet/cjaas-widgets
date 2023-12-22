/* playground-fold */
import { LitElement } from "lit";
import { property } from "lit/decorators/property.js";
import { I18N, createLogger } from "@uuip/unified-ui-platform-sdk";
import { i18nService } from "../i18n/i18n-service";
import LanguageDetector from "i18next-browser-languagedetector";

type Constructor<T> = new (...args: any[]) => T;

export declare class i18nLitMixinInterface {
  lng: string;
  //   t(content: unknown): unknown;
  // type MyFunction = (...args: OneOrMore<string>) => void;
  //   t(...args: Parameters<typeof this.i18n.t>): string;
  t(...args: any[]): string;
  i18nExists(key: string | string[]): boolean;
}

export const i18nLitMixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class i18nLitMixinElement extends superClass {
    @property({ type: String }) lng = "";

    constructor(...args: any[]) {
      super(args[0], args[1]);
      this.init();
    }

    logger = createLogger("[JDS i18n]");
    i18n = i18nService();

    init() {
      // Bind events
      this.i18n.on("failedLoading", (lng, ns, msg) =>
        this.logger.info("i18n resource bundle loading failed:", lng, ns, msg)
      );

      this.i18n.on("initialized", () => this.logger.info("i18n resource bundle initialized"));

      this.i18n.on("languageChanged", lng => {
        this.logger.info("i18n resource bundle changed browsers language:", lng);
        this.lng = lng;
      });

      // Init Info
      this.logger.info("i18n resource bundle initializing with options:", this.i18n.DEFAULT_INIT_OPTIONS);

      this.i18n
        .use(LanguageDetector)
        .init(this.i18n.DEFAULT_INIT_OPTIONS)
        .catch(err => this.logger.error("event=I18NLoadFailure | loading of i18n resource bundle failed", err));
    }

    i18nMixin = I18N.createMixin({ i18n: this.i18n });

    t(...args: Parameters<typeof this.i18n.t>) {
      if (process.env.NODE_ENV === "test") {
        return (args && args.length ? (Array.isArray(args[0]) ? args[0].join("") : args[0]) : "") as string;
      }

      const result = this.i18n.t(...args);
      return result;
    }

    i18nExists(key: string | string[]): boolean {
      const result = this.i18n.exists(key);
      console.log("exists function i18n", key, result);
      return result;
    }
  }
  return i18nLitMixinElement as Constructor<i18nLitMixinInterface> & T;
};
