"use strict";module.export({default:()=>Deck});var LayerManager;module.link('./layer-manager',{default(v){LayerManager=v}},0);var ViewManager;module.link('./view-manager',{default(v){ViewManager=v}},1);var MapView;module.link('../views/map-view',{default(v){MapView=v}},2);var EffectManager;module.link('./effect-manager',{default(v){EffectManager=v}},3);var Effect;module.link('./effect',{default(v){Effect=v}},4);var DeckRenderer;module.link('./deck-renderer',{default(v){DeckRenderer=v}},5);var DeckPicker;module.link('./deck-picker',{default(v){DeckPicker=v}},6);var log;module.link('../utils/log',{default(v){log=v}},7);var GL;module.link('@luma.gl/constants',{default(v){GL=v}},8);var AnimationLoop,createGLContext,trackContextState,setParameters;module.link('luma.gl',{AnimationLoop(v){AnimationLoop=v},createGLContext(v){createGLContext=v},trackContextState(v){trackContextState=v},setParameters(v){setParameters=v}},9);var Stats;module.link('probe.gl',{Stats(v){Stats=v}},10);var EventManager;module.link('mjolnir.js',{EventManager(v){EventManager=v}},11);var assert;module.link('../utils/assert',{default(v){assert=v}},12);var EVENTS;module.link('./constants',{EVENTS(v){EVENTS=v}},13);// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
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

















/* global document */

function noop() {}

const getCursor = ({isDragging}) => (isDragging ? 'grabbing' : 'grab');

function getPropTypes(PropTypes) {
  // Note: Arrays (layers, views, ) can contain falsy values
  return {
    id: PropTypes.string,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    // layer/view/controller settings
    layers: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    layerFilter: PropTypes.func,
    views: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    viewState: PropTypes.object,
    effects: PropTypes.arrayOf(PropTypes.instanceOf(Effect)),
    controller: PropTypes.oneOfType([PropTypes.func, PropTypes.bool, PropTypes.object]),

    // GL settings
    gl: PropTypes.object,
    glOptions: PropTypes.object,
    parameters: PropTypes.object,
    pickingRadius: PropTypes.number,
    useDevicePixels: PropTypes.bool,

    // Callbacks
    onWebGLInitialized: PropTypes.func,
    onResize: PropTypes.func,
    onViewStateChange: PropTypes.func,
    onBeforeRender: PropTypes.func,
    onAfterRender: PropTypes.func,
    onLayerClick: PropTypes.func,
    onLayerHover: PropTypes.func,
    onLoad: PropTypes.func,

    // Debug settings
    debug: PropTypes.bool,
    drawPickingColors: PropTypes.bool,

    // Experimental props

    // Forces a redraw every animation frame
    _animate: PropTypes.bool
  };
}

const defaultProps = {
  id: 'deckgl-overlay',
  width: '100%',
  height: '100%',

  pickingRadius: 0,
  layerFilter: null,
  glOptions: {},
  gl: null,
  layers: [],
  effects: [],
  views: null,
  controller: null, // Rely on external controller, e.g. react-map-gl
  useDevicePixels: true,
  _animate: false,

  onWebGLInitialized: noop,
  onResize: noop,
  onViewStateChange: noop,
  onBeforeRender: noop,
  onAfterRender: noop,
  onLayerClick: null,
  onLayerHover: null,
  onLoad: noop,
  _onMetrics: null,

  getCursor,

  debug: false,
  drawPickingColors: false
};

/* eslint-disable max-statements */
class Deck {
  constructor(props) {
    props = Object.assign({}, defaultProps, props);

    this.width = 0; // "read-only", auto-updated from canvas
    this.height = 0; // "read-only", auto-updated from canvas

    // Maps view descriptors to vieports, rebuilds when width/height/viewState/views change
    this.viewManager = null;
    this.layerManager = null;
    this.effectManager = null;
    this.deckRenderer = null;
    this.deckPicker = null;

    this._needsRedraw = true;

    this.viewState = props.initialViewState || null; // Internal view state if no callback is supplied
    this.interactiveState = {
      isDragging: false // Whether the cursor is down
    };

    // Bind methods
    this._onEvent = this._onEvent.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this._pickAndCallback = this._pickAndCallback.bind(this);
    this._onRendererInitialized = this._onRendererInitialized.bind(this);
    this._onRenderFrame = this._onRenderFrame.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this._onInteractiveStateChange = this._onInteractiveStateChange.bind(this);

    if (!props.gl) {
      // Note: LayerManager creation deferred until gl context available
      if (typeof document !== 'undefined') {
        this.canvas = this._createCanvas(props);
      }
    }
    this.animationLoop = this._createAnimationLoop(props);

    this.stats = new Stats({id: 'deck.gl'});

    this.setProps(props);

    this.animationLoop.start();
  }

  finalize() {
    this.animationLoop.stop();
    this.animationLoop = null;

    if (this.layerManager) {
      this.layerManager.finalize();
      this.layerManager = null;
    }

    if (this.viewManager) {
      this.viewManager.finalize();
      this.viewManager = null;
    }

    if (this.eventManager) {
      this.eventManager.destroy();
    }

    if (!this.props.canvas && !this.props.gl && this.canvas) {
      // remove internally created canvas
      this.canvas.parentElement.removeChild(this.canvas);
      this.canvas = null;
    }
  }

  setProps(props) {
    this.stats.get('setProps Time').timeStart();
    props = Object.assign({}, this.props, props);
    this.props = props;

    // Update CSS size of canvas
    this._setCanvasSize(props);

    // We need to overwrite CSS style width and height with actual, numeric values
    const newProps = Object.assign({}, props, {
      views: this._getViews(props),
      width: this.width,
      height: this.height
    });

    const viewState = this._getViewState(props);
    if (viewState) {
      newProps.viewState = viewState;
    }

    // Update view manager props
    if (this.viewManager) {
      this.viewManager.setProps(newProps);
    }

    // Update layer manager props (but not size)
    if (this.layerManager) {
      this.layerManager.setProps(newProps);
    }

    if (this.effectManager) {
      this.effectManager.setProps(newProps);
    }

    // Update animation loop
    if (this.animationLoop) {
      this.animationLoop.setProps(newProps);
    }

    if (this.deckRenderer) {
      this.deckRenderer.setProps(newProps);
    }

    if (this.deckPicker) {
      this.deckPicker.setProps(newProps);
    }

    this.stats.get('setProps Time').timeEnd();
  }

  // Public API
  // Check if a redraw is needed
  // Returns `false` or a string summarizing the redraw reason
  // opts.clearRedrawFlags (Boolean) - clear the redraw flag. Default `true`
  needsRedraw(opts = {clearRedrawFlags: false}) {
    if (this.props._animate) {
      return 'Deck._animate';
    }

    let redraw = this._needsRedraw;

    if (opts.clearRedrawFlags) {
      this._needsRedraw = false;
    }

    const viewManagerNeedsRedraw = this.viewManager.needsRedraw(opts);
    const layerManagerNeedsRedraw = this.layerManager.needsRedraw(opts);
    const effectManagerNeedsRedraw = this.effectManager.needsRedraw(opts);
    const deckRendererNeedsRedraw = this.deckRenderer.needsRedraw(opts);

    redraw =
      redraw ||
      viewManagerNeedsRedraw ||
      layerManagerNeedsRedraw ||
      effectManagerNeedsRedraw ||
      deckRendererNeedsRedraw;
    return redraw;
  }

  getViews() {
    return this.viewManager.views;
  }

  // Get a set of viewports for a given width and height
  getViewports(rect) {
    return this.viewManager.getViewports(rect);
  }

  pickObject({x, y, radius = 0, layerIds = null}) {
    this.stats.get('pickObject Time').timeStart();
    const layers = this.layerManager.getLayers({layerIds});
    const activateViewport = this.layerManager.activateViewport;
    const selectedInfos = this.deckPicker.pickObject({
      x,
      y,
      radius,
      layers,
      viewports: this.getViewports({x, y}),
      activateViewport,
      mode: 'query',
      depth: 1
    });
    this.stats.get('pickObject Time').timeEnd();
    return selectedInfos.length ? selectedInfos[0] : null;
  }

  pickMultipleObjects({x, y, radius = 0, layerIds = null, depth = 10}) {
    this.stats.get('pickMultipleObjects Time').timeStart();
    const layers = this.layerManager.getLayers({layerIds});
    const activateViewport = this.layerManager.activateViewport;
    const selectedInfos = this.deckPicker.pickObject({
      x,
      y,
      radius,
      layers,
      viewports: this.getViewports({x, y}),
      activateViewport,
      mode: 'query',
      depth
    });
    this.stats.get('pickMultipleObjects Time').timeEnd();
    return selectedInfos;
  }

  pickObjects({x, y, width = 1, height = 1, layerIds = null}) {
    this.stats.get('pickObjects Time').timeStart();
    const layers = this.layerManager.getLayers({layerIds});
    const activateViewport = this.layerManager.activateViewport;
    const infos = this.deckPicker.pickObjects({
      x,
      y,
      width,
      height,
      layers,
      viewports: this.getViewports({x, y, width, height}),
      activateViewport
    });
    this.stats.get('pickObjects Time').timeEnd();
    return infos;
  }

  // Private Methods

  // canvas, either string, canvas or `null`
  _createCanvas(props) {
    let canvas = props.canvas;

    // TODO EventManager should accept element id
    if (typeof canvas === 'string') {
      /* global document */
      canvas = document.getElementById(canvas);
      assert(canvas);
    }

    if (!canvas) {
      canvas = document.createElement('canvas');
      const parent = props.parent || document.body;
      parent.appendChild(canvas);
    }

    const {id, style} = props;
    canvas.id = id;
    Object.assign(canvas.style, style);

    return canvas;
  }

  // Updates canvas width and/or height, if provided as props
  _setCanvasSize(props) {
    if (!this.canvas) {
      return;
    }

    let {width, height} = props;
    // Set size ONLY if props are being provided, otherwise let canvas be layouted freely
    if (width || width === 0) {
      width = Number.isFinite(width) ? `${width}px` : width;
      this.canvas.style.width = width;
    }
    if (height || height === 0) {
      height = Number.isFinite(height) ? `${height}px` : height;
      // Note: position==='absolute' required for height 100% to work
      this.canvas.style.position = 'absolute';
      this.canvas.style.height = height;
    }
  }

  // If canvas size has changed, updates
  _updateCanvasSize() {
    if (this._checkForCanvasSizeChange()) {
      const {width, height} = this;
      this.viewManager.setProps({width, height});
      this.props.onResize({width: this.width, height: this.height});
    }
  }

  // If canvas size has changed, reads out the new size and returns true
  _checkForCanvasSizeChange() {
    const {canvas} = this;
    if (!canvas) {
      return false;
    }
    // Fallback to width/height when clientWidth/clientHeight are 0 or undefined.
    const newWidth = canvas.clientWidth || canvas.width;
    const newHeight = canvas.clientHeight || canvas.height;
    if (newWidth !== this.width || newHeight !== this.height) {
      this.width = newWidth;
      this.height = newHeight;
      return true;
    }
    return false;
  }

  _createAnimationLoop(props) {
    const {width, height, gl, glOptions, debug, useDevicePixels, autoResizeDrawingBuffer} = props;

    return new AnimationLoop({
      width,
      height,
      useDevicePixels,
      autoResizeDrawingBuffer,
      onCreateContext: opts =>
        gl || createGLContext(Object.assign({}, glOptions, opts, {canvas: this.canvas, debug})),
      onInitialize: this._onRendererInitialized,
      onRender: this._onRenderFrame,
      onBeforeRender: props.onBeforeRender,
      onAfterRender: props.onAfterRender
    });
  }

  // Get the most relevant view state: props.viewState, if supplied, shadows internal viewState
  // TODO: For backwards compatibility ensure numeric width and height is added to the viewState
  _getViewState(props) {
    return props.viewState || this.viewState;
  }

  // Get the view descriptor list
  _getViews(props) {
    // Default to a full screen map view port
    let views = props.views || [new MapView({id: 'default-view'})];
    views = Array.isArray(views) ? views : [views];
    if (views.length && props.controller) {
      // Backward compatibility: support controller prop
      views[0].props.controller = props.controller;
    }
    return views;
  }

  _pickAndCallback(options) {
    const pos = options.event.offsetCenter;
    // Do not trigger callbacks when click/hover position is invalid. Doing so will cause a
    // assertion error when attempting to unproject the position.
    if (!pos) {
      return;
    }

    const radius = this.props.pickingRadius;
    const layers = this.layerManager.getLayers();
    const activateViewport = this.layerManager.activateViewport;
    const selectedInfos = this.deckPicker.pickObject({
      x: pos.x,
      y: pos.y,
      radius,
      layers,
      viewports: this.getViewports(pos),
      activateViewport,
      mode: options.mode,
      depth: 1,
      event: options.event
    });
    if (options.callback && selectedInfos) {
      const firstInfo = selectedInfos.find(info => info.index >= 0) || null;
      // As per documentation, send null value when no valid object is picked.
      options.callback(firstInfo, selectedInfos, options.event.srcEvent);
    }
  }

  _updateCursor() {
    if (this.canvas) {
      this.canvas.style.cursor = this.props.getCursor(this.interactiveState);
    }
  }

  // Updates animation props on the layer context
  _updateAnimationProps(animationProps) {
    this.layerManager.context.animationProps = animationProps;
  }

  // Deep integration (Mapbox styles)

  _setGLContext(gl) {
    if (this.layerManager) {
      return;
    }

    // if external context...
    if (!this.canvas) {
      this.canvas = gl.canvas;
      trackContextState(gl, {enable: true, copyState: true});
    }

    setParameters(gl, {
      blend: true,
      blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA],
      polygonOffsetFill: true,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    this.props.onWebGLInitialized(gl);

    if (!this.props._customRender) {
      this.eventManager = new EventManager(gl.canvas, {
        events: {
          click: this._onClick,
          pointermove: this._onPointerMove,
          pointerleave: this._onPointerLeave
        }
      });
      for (const eventType in EVENTS) {
        this.eventManager.on(eventType, this._onEvent);
      }
    }

    this.viewManager = new ViewManager({
      eventManager: this.eventManager,
      onViewStateChange: this._onViewStateChange,
      onInteractiveStateChange: this._onInteractiveStateChange,
      views: this._getViews(this.props),
      viewState: this._getViewState(this.props),
      width: this.width,
      height: this.height
    });

    // viewManager must be initialized before layerManager
    // layerManager depends on viewport created by viewManager.
    assert(this.viewManager);
    const viewport = this.viewManager.getViewports()[0];
    // Note: avoid React setState due GL animation loop / setState timing issue
    this.layerManager = new LayerManager(gl, {
      deck: this,
      stats: this.stats,
      viewport
    });

    this.effectManager = new EffectManager();

    this.deckRenderer = new DeckRenderer(gl);

    this.deckPicker = new DeckPicker(gl);

    this.setProps(this.props);

    this._updateCanvasSize();
    this.props.onLoad();
  }

  _drawLayers(redrawReason) {
    const {gl} = this.layerManager.context;

    setParameters(gl, this.props.parameters);

    this.props.onBeforeRender({gl});

    const layers = this.layerManager.getLayers();
    const activateViewport = this.layerManager.activateViewport;

    this.deckRenderer.renderLayers({
      layers,
      viewports: this.viewManager.getViewports(),
      activateViewport,
      views: this.viewManager.getViews(),
      pass: 'screen',
      redrawReason,
      customRender: Boolean(this.props._customRender),
      effects: this.effectManager.getEffects()
    });

    this.props.onAfterRender({gl});
  }

  // Callbacks

  _onRendererInitialized({gl}) {
    this._setGLContext(gl);
  }

  _onRenderFrame(animationProps) {
    this.stats.get('frameRate').timeEnd();
    this.stats.get('frameRate').timeStart();

    // Log perf stats every second
    if (animationProps.tick % 60 === 0) {
      const table = {};
      this.stats.forEach(stat => {
        table[stat.name] = {
          time: stat.time || 0,
          count: stat.count || 0,
          average: stat.getAverageTime() || 0,
          hz: stat.getHz() || 0
        };
      });
      this.stats.reset();
      log.table(3, table)();

      // Experimental: report metrics
      if (this.props._onMetrics) {
        this.props._onMetrics(table);
      }
    }

    this._updateCanvasSize();

    this._updateCursor();

    // Update layers if needed (e.g. some async prop has loaded)
    // Note: This can trigger a redraw
    this.layerManager.updateLayers();

    // Needs to be done before drawing
    this._updateAnimationProps(animationProps);

    // Check if we need to redraw
    const redrawReason = this.needsRedraw({clearRedrawFlags: true});
    if (!redrawReason) {
      return;
    }

    this.stats.get('Redraw Count').incrementCount();
    if (this.props._customRender) {
      this.props._customRender();
    } else {
      this._drawLayers(redrawReason);
    }
  }

  // Callbacks

  _onViewStateChange(params) {
    // Let app know that view state is changing, and give it a chance to change it
    const viewState = this.props.onViewStateChange(params) || params.viewState;

    // If initialViewState was set on creation, auto track position
    if (this.viewState) {
      this.viewState[params.viewId] = viewState;
      this.viewManager.setProps({viewState});
    }
  }

  _onInteractiveStateChange({isDragging = false}) {
    if (isDragging !== this.interactiveState.isDragging) {
      this.interactiveState.isDragging = isDragging;
    }
  }

  // Route move events to layers. call the `onHover` prop of any picked layer,
  // and `onLayerHover` is called directly from here with any picking info generated by `pickLayer`.
  // @param {Object} event  A mjolnir.js event
  _onClick(event) {
    this._pickAndCallback({
      callback: this.props.onLayerClick,
      event,
      mode: 'click'
    });
  }

  _onEvent(event) {
    const eventOptions = EVENTS[event.type];
    const pos = event.offsetCenter;

    if (!eventOptions || !pos) {
      return;
    }

    // Reuse last picked object
    const layers = this.layerManager.getLayers();
    const info = this.deckPicker.getLastPickedObject({
      x: pos.x,
      y: pos.y,
      layers,
      viewports: this.getViewports(pos)
    });

    const {layer} = info;
    const layerHandler =
      layer && (layer[eventOptions.handler] || layer.props[eventOptions.handler]);
    const rootHandler = this.props[eventOptions.handler];
    let handled = false;

    if (layerHandler) {
      handled = layerHandler.call(layer, info, event);
    }
    if (!handled && rootHandler) {
      rootHandler(info, event);
    }
  }

  _onPointerMove(event) {
    if (event.leftButton || event.rightButton) {
      // Do not trigger onHover callbacks if mouse button is down.
      return;
    }
    this._pickAndCallback({
      callback: this.props.onLayerHover,
      event,
      mode: 'hover'
    });
  }

  _onPointerLeave(event) {
    const layers = this.layerManager.getLayers();
    const activateViewport = this.layerManager.activateViewport;
    this.deckPicker.pickObject({
      x: -1,
      y: -1,
      layers,
      viewports: [],
      activateViewport,
      radius: 1,
      mode: 'hover'
    });
    if (this.props.onLayerHover) {
      this.props.onLayerHover(null, [], event.srcEvent);
    }
  }
}

Deck.getPropTypes = getPropTypes;
Deck.defaultProps = defaultProps;
