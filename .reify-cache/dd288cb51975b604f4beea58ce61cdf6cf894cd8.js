"use strict";module.export({choropleths:()=>choropleths,getPointCloud:()=>getPointCloud,getPoints100K:()=>getPoints100K,getPoints1M:()=>getPoints1M,getPoints5M:()=>getPoints5M,getPoints10M:()=>getPoints10M,getPointFeatures1M:()=>getPointFeatures1M,getMultiPointFeatures100K:()=>getMultiPointFeatures100K});module.export({positionOrigin:()=>positionOrigin,milliMeterOrigin:()=>milliMeterOrigin,meterPaths:()=>meterPaths,milliMeterPaths:()=>milliMeterPaths,milliMeterPathsFiltered:()=>milliMeterPathsFiltered,milliMeterLines:()=>milliMeterLines,points:()=>points,texts:()=>texts,worldGrid:()=>worldGrid,zigzag:()=>zigzag,greatCircles:()=>greatCircles,polygons:()=>polygons},true);var Vector3;module.link('math.gl',{Vector3(v){Vector3=v}},0);var allPoints;module.link('../data/sf.bike.parking.json',{default(v){allPoints=v}},1);var pointGrid;module.link('./utils',{pointGrid(v){pointGrid=v}},2);var pointsToWorldGrid;module.link('./utils/grid-aggregator',{pointsToWorldGrid(v){pointsToWorldGrid=v}},3);var meterTrajectorySmall;module.link('../data/meter-trajectory-small.json',{default(v){meterTrajectorySmall=v}},4);var choropleths;module.link('../data/sf.zip.geo.json',{default(v){choropleths=v}},5);module.link('../data/sample.geo.json',{default:"geojson"},6);module.link('../data/hexagons.json',{default:"hexagons"},7);module.link('../data/sfmta.routes.json',{default:"routes"},8);module.link('../data/trips.json',{default:"trips"},9);module.link('../data/icon-atlas.json',{default:"iconAtlas"},10);module.link('../data/sf.s2cells.json',{default:"s2cells"},11);

/* load data samples for display */














const positionOrigin = [-122.42694203247012, 37.751537058389985];

const milliMeterOrigin = [-122.47030581871572, 37.744657531698184];

const meterPaths = [
  {
    path: [
      new Vector3(2584.484798702775, 3742.5945553739575, 0),
      new Vector3(-4908.5139320879325, -2429.453672569738, 0)
    ]
  }
];

const milliMeterPaths = [{path: []}];

const path = milliMeterPaths[0].path;
for (let i = 0; i < meterTrajectorySmall.length / 3; ++i) {
  path.push(
    new Vector3(
      meterTrajectorySmall[i * 3],
      meterTrajectorySmall[i * 3 + 1],
      meterTrajectorySmall[i * 3 + 2]
    )
  );
}

const milliMeterPathsFiltered = [{path: []}];
const filteredPath = milliMeterPathsFiltered[0].path;

let lastPoint;
for (let i = 0; i < path.length; ++i) {
  const point = path[i];
  if (!lastPoint || lastPoint.distance(point) > 0.01) {
    filteredPath.push(point);
  }
  lastPoint = point;
}

const milliMeterLines = [];
for (let i = 0; i < path.length - 1; ++i) {
  const v = new Vector3(path[i]);
  if (v.distance(path[i + 1]) > 0.01) {
    milliMeterLines.push({
      sourcePosition: path[i],
      targetPosition: path[i + 1]
    });
  }
}

const points = allPoints;

// texts of random size in [24, 48]
const texts = allPoints.map(p =>
  Object.assign({}, p, {size: Math.floor(Math.random() * 24) + 24})
);

const worldGrid = pointsToWorldGrid(points, 500);

const zigzag = [
  {
    // Big zigzag
    path: new Array(12)
      .fill(0)
      .map((d, i) => [
        positionOrigin[0] + i * i * 0.001,
        positionOrigin[1] + (Math.cos(i * Math.PI) * 0.2) / (i + 4)
      ])
  },
  {
    // Tiny zigzag
    path: new Array(12)
      .fill(0)
      .map((d, i) => [
        positionOrigin[0] - 0.001 - i * i * 1e-5,
        positionOrigin[1] + (Math.cos(i * Math.PI) * 2e-3) / (i + 4)
      ])
  },
  {
    // Tiny circle
    path: new Array(25)
      .fill(0)
      .map((d, i) => [
        positionOrigin[0] + Math.cos((i / 12) * Math.PI) * 2e-5,
        positionOrigin[1] + Math.sin((i / 12) * Math.PI) * 2e-5
      ])
  },
  {
    path: [
      [positionOrigin[0] - 0.005, positionOrigin[1] + 0.005],
      [positionOrigin[0] - 0.005, positionOrigin[1] - 0.005]
    ]
  }
];

const greatCircles = [
  {source: [120, 0], target: [-60, 0]},
  {source: [120, 10], target: [-60, -10]},
  {source: [120, -10], target: [-60, 10]},
  {source: [-120, 0], target: [60, 0]},
  {source: [-120, 10], target: [60, -10]},
  {source: [-120, -10], target: [60, 10]},
  {source: [-40, 10], target: [-140, 10]},
  {source: [-40, 20], target: [-140, 20]},
  {source: [-40, 30], target: [-140, 30]},
  {source: [-40, 40], target: [-140, 40]},
  {source: [-40, 50], target: [-140, 50]},
  {source: [-40, 60], target: [-140, 60]},
  {source: [-40, 70], target: [-140, 70]},
  {source: [10, 80], target: [20, 30]},
  {source: [20, 80], target: [40, 30]},
  {source: [30, 80], target: [60, 30]},
  {source: [40, 80], target: [80, 30]},
  {source: [50, 80], target: [100, 30]},
  {source: [60, 80], target: [120, 30]},
  {source: [70, 80], target: [140, 30]},
  {source: [-40, -10], target: [-140, -10]},
  {source: [-40, -20], target: [-140, -30]},
  {source: [-40, -30], target: [-140, -60]},
  {source: [-40, -40], target: [-140, -80]},
  {source: [20, -30], target: [20, -80]},
  {source: [40, -30], target: [40, -80]},
  {source: [60, -30], target: [60, -80]},
  {source: [80, -30], target: [80, -80]},
  {source: [100, -30], target: [100, -80]},
  {source: [120, -30], target: [120, -80]},
  {source: [140, -30], target: [140, -80]}
];

// Extract simple/complex polygons arrays from geojson
const polygons = choropleths.features.map(choropleth => choropleth.geometry.coordinates);

// time consuming - only generate on demand

let _pointCloud = null;
function getPointCloud() {
  if (!_pointCloud) {
    const RESOLUTION = 100;
    const R = 1000;
    _pointCloud = [];

    // x is longitude, from 0 to 360
    // y is latitude, from -90 to 90
    for (let yIndex = 0; yIndex <= RESOLUTION; yIndex++) {
      const y = (yIndex / RESOLUTION - 1 / 2) * Math.PI;
      const cosy = Math.cos(y);
      const siny = Math.sin(y);
      // need less samples at high latitude
      const xCount = Math.floor(cosy * RESOLUTION * 2) + 1;

      for (let xIndex = 0; xIndex < xCount; xIndex++) {
        const x = (xIndex / xCount) * Math.PI * 2;
        const cosx = Math.cos(x);
        const sinx = Math.sin(x);

        _pointCloud.push({
          position: [cosx * R * cosy, sinx * R * cosy, (siny + 1) * R],
          normal: [cosx * cosy, sinx * cosy, siny],
          color: [(siny + 1) * 128, (cosy + 1) * 128, 0]
        });
      }
    }
  }
  return _pointCloud;
}

const SF_BOUNDING_BOX = [-122.6, 37.6, -122.2, 37.9];

function generatePointFeatures(featureCount) {
  const features = pointGrid(featureCount, SF_BOUNDING_BOX).map(coordinate => ({
    type: 'Feature',
    geometry: {type: 'Point', coordinates: coordinate}
  }));
  return features;
}

function generateMultiPointFeatures(featureCount, pointsPerFeature) {
  const allMultiPoints = pointGrid(featureCount * pointsPerFeature, SF_BOUNDING_BOX);
  const features = [];
  for (let featureIndex = 0; featureIndex < featureCount; featureIndex++) {
    const multiPoints = allMultiPoints.slice(
      featureIndex * pointsPerFeature,
      featureIndex * pointsPerFeature + pointsPerFeature
    );
    features.push({
      type: 'Feature',
      geometry: {type: 'MultiPoint', coordinates: multiPoints}
    });
  }
  return features;
}

let _points100K = null;
function getPoints100K() {
  _points100K = _points100K || pointGrid(1e5, SF_BOUNDING_BOX);
  return _points100K;
}

let _points1M = null;
function getPoints1M() {
  _points1M = _points1M || pointGrid(1e6, SF_BOUNDING_BOX);
  return _points1M;
}

let _points5M = null;
function getPoints5M() {
  _points5M = _points5M || pointGrid(5 * 1e6, SF_BOUNDING_BOX);
  return _points5M;
}

let _points10M = null;
function getPoints10M() {
  _points10M = _points10M || pointGrid(1e7, SF_BOUNDING_BOX);
  return _points10M;
}

let _pointFeatures1M = null;
function getPointFeatures1M() {
  _pointFeatures1M = _pointFeatures1M || generatePointFeatures(1e6);
  return _pointFeatures1M;
}

let _multiPointFeatures100K = null;
function getMultiPointFeatures100K() {
  _multiPointFeatures100K = _multiPointFeatures100K || generateMultiPointFeatures(1e5, 10);
  return _multiPointFeatures100K;
}
