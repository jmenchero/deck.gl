"use strict";var test;module.link('tape-catch',{default(v){test=v}},0);var color;module.link('@deck.gl/core/utils/color',{default(v){color=v}},1);// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.



const {parseColor} = color;

const TEST_CASES = [
  {
    title: '4 element array',
    argument: [127, 128, 129, 130],
    result: [127, 128, 129, 130]
  },
  {
    title: '3 element array',
    argument: [127, 128, 129],
    result: [127, 128, 129, 255]
  },
  {
    title: '3 component hex string',
    argument: '#ff8000',
    result: [255, 128, 0, 255]
  },
  {
    title: '4 component hex string',
    argument: '#10101010',
    result: [16, 16, 16, 16]
  }
];

test('color#import', t => {
  t.ok(typeof parseColor === 'function', 'parseColor imported OK');
  t.end();
});

test('color#parseColor', t => {
  for (const tc of TEST_CASES) {
    const result = parseColor(tc.argument);
    t.deepEqual(result, tc.result, `parseColor ${tc.title} returned expected result`);
  }
  t.end();
});
