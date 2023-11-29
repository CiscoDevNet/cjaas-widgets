/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fixture, fixtureCleanup, html } from "@open-wc/testing-helpers";
import "./Timer";
import { Timer } from "./Timer";

describe("Timer component", () => {
  afterEach(() => {
    fixtureCleanup();
  });

  test("should render one Timer component", async () => {
    expect.hasAssertions();
    const component: Timer.ELEMENT = await fixture(
      html`
        <cjaas-timer></cjaas-timer>
      `
    );
    expect(component).not.toBeNull();
  });
});
