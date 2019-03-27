"use strict";var test;module.link('tape-catch',{default(v){test=v}},0);var EffectManager;module.link('@deck.gl/core/lib/effect-manager',{default(v){EffectManager=v}},1);var Effect;module.link('@deck.gl/core/lib/effect',{default(v){Effect=v}},2);var LayerManager;module.link('@deck.gl/core/lib/layer-manager',{default(v){LayerManager=v}},3);var gl;module.link('@deck.gl/test-utils',{gl(v){gl=v}},4);// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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








const layerManager = new LayerManager(gl);

test('EffectManager#constructor', t => {
  const effectManager = new EffectManager({gl, layerManager});
  t.ok(effectManager, 'Effect Manager created');
  t.end();
});

test('EffectManager#set and get Effects', t => {
  const effectManager = new EffectManager({gl, layerManager});
  const effect1 = new Effect();
  const effect2 = new Effect();
  effectManager.setEffects([effect1, effect2]);
  const effects = effectManager.getEffects();
  t.equal(effects.length, 2, 'Effect set and get successfully');
  t.end();
});
