/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fixture, fixtureCleanup, html } from "@open-wc/testing-helpers";
import "./Identity";
import { Identity } from "./Identity";

describe("Identity component", () => {
  afterEach(() => {
    fixtureCleanup();
  });

  test("should render one Timer component", async () => {
    expect.hasAssertions();
    const component: Identity.ELEMENT = await fixture(
      html`
        <cjaas-identity></cjaas-identity>
      `
    );
    expect(component).not.toBeNull();
  });
});
