import { LitElement, html, customElement, property, PropertyValues } from 'lit-element'
import { sampleEvent, sampleTemplate } from "./sandbox.mock.ts";
import "@momentum-ui/web-components";
import "@cjaas/common-components";
import "../ProfileView/dist/index";

@customElement('main-view')
class KitchenSink extends LitElement {
  @property({ type: Number }) count = 0
  @property({ type: Boolean }) darkTheme = false;
  @property({ type: Boolean }) lumos = false;

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (this.darkTheme) {
      document.body.style.backgroundColor = "#000";
      document.body.style.color = "#fff";
    } else {
      document.body.style.backgroundColor = "#fff";
      document.body.style.color = "#000";
    }
  }

  toggleSetting(event: MouseEvent) {
    const composedPath = event.composedPath();
    const target = (composedPath[0] as unknown) as HTMLOrSVGElement;
    const { aspect } = target.dataset;
    if (aspect === "lumos") {
      this.lumos = !this.lumos;
    } else if (aspect === "darkTheme") {
      this.darkTheme = !this.darkTheme;
    } else {
      console.error("Invalid data-aspect input");
      return;
    }
  }

  themeToggle() {
    return html`
      <div class="toggle-container">
        <label class="switch">
          <input type="checkbox" id="theme-switch" class="theme-switch" data-aspect="darkTheme" @click=${this.toggleSetting}
            ?checked=${this.darkTheme} />
          Dark Mode
        </label>
        <label class="switch">
          <input type="checkbox" class="lumos-switch" data-aspect="lumos" @click=${this.toggleSetting}
            ?checked=${this.lumos} />
          Lumos Theme
        </label>
      </div>
    `;
  }


  clickHandler() {
    this.count++
  }

  render() {
    return html`
    <md-theme ?lumos=${this.lumos} ?darkTheme=${this.darkTheme}>
      ${this.themeToggle()}
      <cjaas-profile-view-widget id="view" customer="560021-Venki" .template=${sampleTemplate}
        .authToken=${"st=demoassure&so=sandbox&ss=stream&sp=w&se=2021-04-06T07:38:17Z&sk=sandbox&sig=qnKHkG1aAZryxbBfgTLG1XR8jLFbztQ4xKyn5APjdSY="}
          ></cjaas-profile-view-widget>
        </md-theme>
    `
  }
}