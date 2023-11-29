/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fixture, fixtureCleanup, html } from "@open-wc/testing-helpers";
import "./TimelineItemV2";
import { TimelineItemV2 } from "./TimelineItemV2";

describe("TimelineItemV2 component", () => {
  afterEach(() => {
    fixtureCleanup();
  });

  test("should render one timelineItemV2 component", async () => {
    expect.hasAssertions();
    const component: TimelineItemV2.ELEMENT = await fixture(
      html`
        <cjaas-timeline-item></cjaas-timeline-item>
      `
    );
    expect(component).not.toBeNull();
  });
});
