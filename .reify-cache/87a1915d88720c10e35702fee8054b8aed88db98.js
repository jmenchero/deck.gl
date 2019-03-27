"use strict";var test;module.link('tape-catch',{default(v){test=v}},0);var View,MapView;module.link('deck.gl',{View(v){View=v},MapView(v){MapView=v}},1);


test('View#imports', t => {
  t.ok(View, 'View import ok');
  t.end();
});

test('View#equals', t => {
  const mapView1 = new MapView({
    id: 'default-view',
    latitude: 0,
    longitude: 0,
    zoom: 11,
    position: [0, 0]
  });
  const mapView2 = new MapView({
    id: 'default-view',
    latitude: 0,
    longitude: 0,
    zoom: 11,
    position: [0, 0]
  });
  const mapView3 = new MapView({
    id: 'default-view',
    latitude: 0,
    longitude: 0,
    zoom: 11,
    position: [0, 1]
  });
  const mapView4 = new View({
    id: 'default-view',
    latitude: 0,
    longitude: 0,
    zoom: 11,
    position: [0, 0]
  });

  t.ok(mapView1.equals(mapView2), 'Identical view props');
  t.notOk(mapView1.equals(mapView3), 'Different view props');
  t.notOk(mapView1.equals(mapView4), 'Different type');

  t.end();
});
