"use strict";var test;module.link('tape-catch',{default(v){test=v}},0);var testLayer,generateLayerTests;module.link('@deck.gl/test-utils',{testLayer(v){testLayer=v},generateLayerTests(v){generateLayerTests=v}},1);var GeoJsonLayer;module.link('deck.gl',{GeoJsonLayer(v){GeoJsonLayer=v}},2);var FIXTURES;module.link('deck.gl-test/data',{"*"(v){FIXTURES=v}},3);// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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








test('GeoJsonLayer#tests', t => {
  const testCases = generateLayerTests({
    Layer: GeoJsonLayer,
    sampleProps: {
      data: FIXTURES.choropleths
    },
    assert: t.ok,
    onBeforeUpdate: ({testCase}) => t.comment(testCase.title),
    onAfterUpdate: ({layer, subLayers}) => {
      t.ok(layer.state.features, 'should update features');
      const hasData = layer.props && layer.props.data && Object.keys(layer.props.data).length;
      t.is(
        subLayers.length,
        !hasData ? 0 : layer.props.stroked ? 2 : 1,
        'correct number of sublayers'
      );
    }
  });

  testLayer({Layer: GeoJsonLayer, testCases, onError: t.notOk});

  t.end();
});
