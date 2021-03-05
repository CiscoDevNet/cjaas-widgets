/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'my-custom-component',
  templateUrl: './my-custom-component.component.html',
  styleUrls: ['./my-custom-component.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class MyCustomComponentComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
