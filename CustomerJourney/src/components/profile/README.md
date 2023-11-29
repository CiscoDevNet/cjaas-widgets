## Profile Component

Creates a snapshot of an end user (customer) for Agent to cross verify while resolving issues via Call/Walk In.

![]("../../assets/images/profile-sample.png")

## Usage

```html
<cjaas-profile .profileData="${profileMock}"></cjaas-profile>
<cjaas-profile snapshot .contactData="${profileMock}"></cjaas-profile>
<cjaas-profile compact .contactData="${profileMock}"></cjaas-profile>
<cjaas-profile loading compact .contactData="${profileMock}"></cjaas-profile>
```

You may take a look at `src/[sandbox]/sandbox.mock.ts` file to see how to structure the mock objects or see examples down below.

## Attributes

#### `profileData : (array) of attribute objects` _(refer to CJaaS API)_

This property allows passing comprehensive profile data, including table data.

#### `contactData : ContactData`

When table data is not necessary, i.e. for compact and snapshot usage, this is a simplified data interface for abvoe the fold profile information.

```typescript=
interface ContactData {
  contactChannels?: ContactChannel[];
  email?: string;
  name?: string;
  label?: string;
  imgSrc?: string;
}
interface ContactChannel {
  [key: string]: string;
}
```

#### `snapshot : boolean`

Renders a simplified profile card

#### `compact : boolean`

Renders a slim simple compact profile card

#### `loading : boolean`

Control this attribute to allow loading state while awaiting API response

![]("../../assets/images/small-profile-sample.png")

## Localization

By default, if no data is available the component will render the message "No data provided", but this can be easily replaced with Localized text content using the named slot `"l10n-no-data-message"`.

```html
<cjaas-profile>
  <p slot="l10n-no-data-message">No se han proporcionado datos</p>
</cjaas-profile>
```

### TO DO

Populate ContactChannels section from Profile Data when `contactData` is missing.
Make the ContactChannels section render by iterating with `contactItem()`.
