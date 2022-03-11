# CJaaS Template Builder Widget

Create Templates for Journey Profile Views. 

## Component Usage

```html
<cjaas-template-builder
    template-id="second-template"
    .profileReadSasToken=${profileReadToken}
    .profileWriteSasToken=${profileWriteToken}
    base-url="https://uswest-nonprod.cjaas.cisco.com"
></cjaas-template-builder>
```

## Properties

### `template-id string`
id of template for edit

### `profile-read-sas-token string`
Shared Access Signature with read permisson to access template config.

### `profile-write-sas-token string`
Shared Access Signature with write permission to create or update a template

### `base-url string`
API Host to use while making REST calls to server

## Setup

Install dependencies:

`npm install` or `yarn`

### Getting started

To run your widget on `localhost`, please navigate to widget's root directory in Terminal (Command line tool) and run the following commands (Assuming you have [`yarn`](https://classic.yarnpkg.com/en/docs/install/#mac-stable) installed globally on your machine):

1. Clone this repo.
2. Navigate to th widget/widget starter folder.
3. Run `yarn` from the root of the repo.
4. Run `yarn start` or `npm run start` to start the playground (sandbox) app.

### Editing widget

There is generally no need for you to modify anything outside of the `src/components` folder. To customize you widget, we suggest for you to work within this directory. You are free to create your components and structure them however you see fit.

### Building/exporting widget

Once you are ready to export your widget, all you need is to run the following command in Terminal (Command line tool):
Note: Built on Node version 10.13.0 (will be upgraded in near future)

```
yarn dist
```

This will create a `dist` folder in the root directory of your widget with generated files.
`index.js` file that contains your entire set of widgets. Additionally, it generates the fonts, icons and its styles necessary for the components to use momentum icons & fonts. Your host web page needs to import these resources. These files can be renamed and uploaded to a preferred location on a CDN (e.g. an S3 bucket on AWS. Please keep in mind that this file has to be publicly available over the internet to be accessible to Agent or Supervisor Desktop).

```
<script src="PATH TO YOUR WIDGET/INDEX.JS"></script>
```