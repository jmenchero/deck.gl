"use strict";module.export({getShaders:()=>getShaders,getBuffers:()=>getBuffers,padBuffer:()=>padBuffer});var Buffer;module.link('luma.gl',{Buffer(v){Buffer=v}},0);var padArray;module.link('../utils/array-utils',{padArray(v){padArray=v}},1);


const ATTRIBUTE_MAPPING = {
  1: 'float',
  2: 'vec2',
  3: 'vec3',
  4: 'vec4'
};

function getShaders(transitions) {
  // Build shaders
  const varyings = [];
  const attributeDeclarations = [];
  const uniformsDeclarations = [];
  const varyingDeclarations = [];
  const calculations = [];

  for (const attributeName in transitions) {
    const transition = transitions[attributeName];
    const attributeType = ATTRIBUTE_MAPPING[transition.attribute.size];

    if (attributeType) {
      transition.bufferIndex = varyings.length;
      varyings.push(attributeName);

      attributeDeclarations.push(`attribute ${attributeType} ${attributeName}From;`);
      attributeDeclarations.push(`attribute ${attributeType} ${attributeName}To;`);
      uniformsDeclarations.push(`uniform float ${attributeName}Time;`);
      varyingDeclarations.push(`varying ${attributeType} ${attributeName};`);
      calculations.push(`${attributeName} = mix(${attributeName}From, ${attributeName}To,
        ${attributeName}Time);`);
    }
  }

  const vs = `
#define SHADER_NAME feedback-vertex-shader
${attributeDeclarations.join('\n')}
${uniformsDeclarations.join('\n')}
${varyingDeclarations.join('\n')}

void main(void) {
  ${calculations.join('\n')}
  gl_Position = vec4(0.0);
}
`;

  const fs = `\
#define SHADER_NAME feedback-fragment-shader

precision highp float;

${varyingDeclarations.join('\n')}

void main(void) {
  gl_FragColor = vec4(0.0);
}
`;
  return {vs, fs, varyings};
}

function getBuffers(transitions) {
  const sourceBuffers = {};
  const feedbackBuffers = {};
  for (const attributeName in transitions) {
    const {fromState, toState, buffer} = transitions[attributeName];
    sourceBuffers[`${attributeName}From`] = fromState;
    sourceBuffers[`${attributeName}To`] = toState;
    feedbackBuffers[`${attributeName}`] = buffer;
  }
  return {sourceBuffers, feedbackBuffers};
}

function padBuffer({
  fromState,
  toState,
  fromLength,
  toLength,
  fromBufferLayout,
  toBufferLayout,
  getData = x => x
}) {
  const hasBufferLayout = fromBufferLayout && toBufferLayout;

  // check if buffer needs to be padded
  if ((!hasBufferLayout && fromLength >= toLength) || !(fromState instanceof Buffer)) {
    return;
  }

  const data = new Float32Array(toLength);
  const fromData = fromState.getData({});

  const {value, buffer, size, constant} = toState;
  const toData = value || buffer.getData({});

  const getMissingData = constant
    ? (i, chunk) => getData(value, chunk)
    : (i, chunk) => getData(toData.subarray(i, i + size), chunk);

  padArray({
    source: fromData,
    target: data,
    sourceLayout: fromBufferLayout,
    targetLayout: toBufferLayout,
    size: toState.size,
    getData: getMissingData
  });

  fromState.setData({data});
}
