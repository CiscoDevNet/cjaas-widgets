/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DireflowComponent } from 'direflow-component';
import App from './direflow-component/App';

const direflowComponent = new DireflowComponent();

const direflowProperties = {
  componentTitle: 'React Component',
  sampleList: [
    'Create with React',
    'Build as Web Component',
    'Use it anywhere!',
  ],
};

const direflowPlugins = [
  {
    name: 'font-loader',
    options: {
      google: {
        families: ['Advent Pro', 'Noto Sans JP'],
      },
    },
  },
];

direflowComponent.configure({
  name: 'my-react-widget',
  useShadow: true,
  properties: direflowProperties,
  plugins: direflowPlugins,
});

direflowComponent.create(App);
