/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fixture, fixtureCleanup, html } from "@open-wc/testing-helpers";
import "./TimelineV2";
import { TimelineV2 } from "./TimelineV2";

describe("TimelineV2 component", () => {
  afterEach(() => {
    fixtureCleanup();
  });

  test("should render one timelineV2 component", async () => {
    expect.hasAssertions();
    const component: TimelineV2.ELEMENT = await fixture(
      html`
        <cjaas-timeline-v2></cjaas-timeline-v2>
      `
    );
    expect(component).not.toBeNull();
  });
});
