(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var dragMock = require('./src/index.js');

if (typeof define === 'function') {
  define('dragMock', function() {
    return dragMock;
  });
} else {
  window.dragMock = dragMock;
}

},{"./src/index.js":4}],2:[function(require,module,exports){

var eventFactory = require('./eventFactory');


function _noop() {}


function mergeInto(destObj, srcObj) {
  for (var key in srcObj) {
    if (!srcObj.hasOwnProperty(key)) { continue; }   // ignore inherited properties

    destObj[key] = srcObj[key];
  }

  return destObj;
}


function parseParams(targetElement, eventProperties, configCallback) {
  if (typeof eventProperties === 'function') {
    configCallback = eventProperties;
    eventProperties = null;
  }

  if (typeof targetElement !== 'object') {
    throw new Error('Expected first parameter to be a targetElement. Instead got: ' + targetElement);
  }

  return {
    targetElement: targetElement,
    eventProperties: eventProperties || {},
    configCallback: configCallback || _noop
  };
}


function createEvent(eventName) {
  if (eventName.substr(0, 5) === 'mouse') {
    return eventFactory.createEvent(eventName, 'MouseEvent');
  } else {
    return eventFactory.createEvent(eventName, 'Event');
  }
}


function customizeEvent(event, eventProperties, configCallback, isPrimaryEvent) {
  // copy eventProperties into event
  if (eventProperties) {
    mergeInto(event, eventProperties);
  }

  if (configCallback) {
    // call configCallback only for the primary event if the callback takes less than two arguments
    if (configCallback.length < 2 && isPrimaryEvent) {
      configCallback(event);
    }
    // call configCallback for each event if the callback takes two arguments
    else {
      configCallback(event, event.type);
    }
  }
}


function createAndDispatchEvents(targetElement, eventNames, primaryEventName, eventProperties, configCallback) {
  eventNames.forEach(function(eventName) {
    var event = createEvent(eventName);
    var isPrimaryEvent = eventName === primaryEventName;

    customizeEvent(event, eventProperties, configCallback, isPrimaryEvent);

    targetElement.dispatchEvent(event);
  });
}


var DragDropAction = function() {
  this.lastDragSource = null;
};


DragDropAction.prototype.dragStart = function(targetElement, eventProperties, configCallback) {
  var params = parseParams(targetElement, eventProperties, configCallback);
  var events = ['mousedown', 'dragstart', 'drag'];

  createAndDispatchEvents(targetElement, events, 'drag', params.eventProperties, params.configCallback);

  this.lastDragSource = targetElement;

  return this;
};


DragDropAction.prototype.drop = function(targetElement, eventProperties, configCallback) {
  var params = parseParams(targetElement, eventProperties, configCallback);
  var events = ['mouseup', 'drop'];

  createAndDispatchEvents(targetElement, events, 'drop', params.eventProperties, params.configCallback);

  if (this.lastDragSource) {
    // trigger dragend event on last drag source element
    createAndDispatchEvents(this.lastDragSource, ['dragend'], 'drop', params.eventProperties, params.configCallback);
  }

  return this;
};

module.exports = DragDropAction;

},{"./eventFactory":3}],3:[function(require,module,exports){

// uses event constructors
var ModernEventFactory = {
  createEvent: function(eventName, eventType) {
    var constructor = window[eventType];

    return new constructor(eventName, {
      view: window,
      bubbles: true,
      cancelable: true
    });
  }
};

// uses document.createEvent()
var FallbackEventFactory = {
  createEvent: function(eventName, eventType) {
    var event = document.createEvent(eventType);

    event.initEvent(eventName, true, true);

    return event;
  }
};

if (document.implementation.hasFeature('MouseEvent', '4.0')) {
  module.exports = ModernEventFactory;
} else {
  module.exports = FallbackEventFactory;
}

},{}],4:[function(require,module,exports){

var DragDropAction = require('./DragDropAction');


function call(instance, methodName, args) {
  return instance[methodName].apply(instance, args);
}


var DragMock = {
  dragStart: function(targetElement, eventProperties, configCallback) {
    return call(new DragDropAction(), 'dragStart', arguments);
  },
  drop: function(targetElement, eventProperties, configCallback) {
    return call(new DragDropAction(), 'drop', arguments);
  }
};

module.exports = DragMock;

},{"./DragDropAction":2}]},{},[1]);
