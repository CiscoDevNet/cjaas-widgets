/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fixture, fixtureCleanup, html } from "@open-wc/testing-helpers";
import "./TimelineItem";
import { TimelineItem } from "./TimelineItem";

describe("TimelineItem component", () => {
  afterEach(() => {
    fixtureCleanup();
  });

  test("should render one timelineItem component", async () => {
    expect.hasAssertions();
    const component: TimelineItem.ELEMENT = await fixture(
      html`
        <cjaas-timeline-item></cjaas-timeline-item>
      `
    );
    expect(component).not.toBeNull();
  });

  // renderShowcase for grouped timeline item
  // renderShowcase for event without showcase set
  // renderShowcase for event with showcase set
  // renderShowcase for survey event

  // test("Should return ___ for renderShowcase()", async () => {
  //   expect.hasAssertions();
  //   const component: TimelineItem.ELEMENT = await fixture(
  //     html`
  //       <cjaas-timeline-item
  //         .event=${event}
  //         .title=${event.type}
  //         .time=${event.time}
  //         .data=${event.data}
  //         .id=${event.id}
  //         .person=${event.person || null}
  //         .eventIconTemplate=${this.eventIconTemplate}
  //         class="has-line show-${this.activeTypes.includes(event.type) || this.activeDates.includes(stringDate)}"
  //       >
  //       </cjaas-timeline-item>
  //     `
  //   );
  //   expect(component).not.toBeNull();
  // });
});
