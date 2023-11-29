/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fixture, fixtureCleanup, html } from "@open-wc/testing-helpers";
import "./Timeline";
import { Timeline } from "./Timeline";

describe("Timeline component", () => {
  afterEach(() => {
    fixtureCleanup();
  });

  test("should render one timeline component", async () => {
    expect.hasAssertions();
    const component: Timeline.ELEMENT = await fixture(
      html`
        <cjaas-timeline></cjaas-timeline>
      `
    );
    expect(component).not.toBeNull();
  });
});
