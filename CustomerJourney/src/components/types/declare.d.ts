/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "*.scss" {
  const css: CSSResult;
  export default css;
}

declare module "*.svg" {
  const svg: any;
  export default svg;
}

declare module "@momentum-ui/utils/lib/getColorValue";

declare module "query-selector-shadow-dom";

declare module "country-codes-list";
declare interface Attendee {
  title: string;
  src?: string;
  alt?: string;
}

declare module "highlight.js/lib/core";

declare module "*.mdx" {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}
