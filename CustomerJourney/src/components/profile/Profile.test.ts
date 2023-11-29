/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { fixture, fixtureCleanup, html } from "@open-wc/testing-helpers";
import "../profile/Profile";
import { ProfileView } from "../profile/Profile";

export const contactDataMock: ProfileView.ContactData = {
  contactChannels: {
    email: "v3nki@venki.com",
    phone: "555-555-5555",
    whatsApp: "MyProfileName",
  },
  name: "Venki",
  email: "v3nki@venki.com",
  label: "Preferred customer",
};

export const profileMock = [
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "email",
      displayName: "Email",
      aggregationMode: "Value",
      type: "tab",
      tag: "email",
      limit: 1,
      Verbose: true,
    },
    result: ["v3nki"],
    journeyevents: [
      {
        data: {
          firstName: "Venki",
          lastName: "V",
          email: "v3nki",
        },
        dataContentType: "application/json",
        id: "9cc22087-284d-46db-9e4e-fa7ed9723976",
        person: "560021-Venki",
        source: "Website",
        specVersion: "1.0",
        time: "2021-03-05T19:00:05.596Z",
        type: "Quote",
      },
    ],
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "Make",
      displayName: "Make",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "Model",
      displayName: "Model",
      limit: 1,
      aggregationMode: "Value",
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "License Plate",
      displayName: "License Plate",
      limit: 1,
      aggregationMode: "Value",
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "ltv",
      displayName: "LTV",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "name",
      displayName: "First Name",
      limit: 1,
      aggregationMode: "Value",
      tag: "name",
      type: "inline",
    },
    result: ["Venki"],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      limit: 1,
      metadata: "zipCode",
      displayName: "Zip Code",
      aggregationMode: "Value",
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "street",
      displayName: "Street",
      limit: 1,
      aggregationMode: "Value",
      type: "table",
    },
    result: ["street1"],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      limit: 1,
      metadata: "apt",
      displayName: "Apt",
      aggregationMode: "Value",
      type: "table",
    },
    result: ["apt1"],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      limit: 1,
      metadata: "city",
      displayName: "City",
      aggregationMode: "Value",
      type: "table",
    },
    result: ["bengaluru"],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      limit: 1,
      event: "Quote",
      metadata: "lastName",
      displayName: "Last Name",
      aggregationMode: "Value",
      tag: "name",
      type: "inline",
    },
    result: ["V"],
    journeyevents: null,
  },
];

describe("Profile component", () => {
  afterEach(() => {
    fixtureCleanup();
  });

  test("should render one profile component", async () => {
    const component: ProfileView.ELEMENT = await fixture(
      html`
        <cjaas-profile .contactData=${contactDataMock}> </cjaas-profile>
      `
    );
    expect(component).not.toBeNull();
  });

  test("should render one profile component with email text content", async () => {
    const component: ProfileView.ELEMENT = await fixture(
      html`
        <cjaas-profile .contactData=${contactDataMock} .profileData=${profileMock}></cjaas-profile>
      `
    );

    expect(component).not.toBeNull();

    const contactItemDiv = component.shadowRoot?.querySelector(".contact-item");
    expect(contactItemDiv).not.toBeNull();

    const innerHTML = component.shadowRoot?.innerHTML;
    expect(innerHTML).toContain(component.contactData?.email);
  });

  test("should render one profile component", async () => {
    const component: ProfileView.ELEMENT = await fixture(
      html`
        <cjaas-profile .profileData=${profileMock} .contactData=${contactDataMock}> </cjaas-profile>
      `
    );
    expect(component.getValue(component.profileData[0])).toBe(profileMock[0].result[0]);
  });
  test("should render snapshot view", async () => {
    const component: ProfileView.ELEMENT = await fixture(
      html`
        <cjaas-profile .contactData=${contactDataMock} .profileData=${profileMock} snapshot> </cjaas-profile>
      `
    );

    expect(component).not.toBeNull();

    component.snapshot = true;
    await component.updateComplete;
    const snapshotContainer = component.shadowRoot?.querySelector(".snapshot");
    expect(snapshotContainer).not.toBeNull();
  });
  test("should render compact view", async () => {
    const component: ProfileView.ELEMENT = await fixture(
      html`
        <cjaas-profile .contactData=${contactDataMock} .profileData=${profileMock} compact> </cjaas-profile>
      `
    );
    component.compact = true;
    await component.updateComplete;
    const compactContainer = component.shadowRoot?.querySelector(".compact");
    expect(compactContainer).not.toBeNull();
  });
});
