'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function getEventClientOffset(e) {
  return {
    x: e.clientX,
    y: e.clientY
  };
}

var ELEMENT_NODE = 1;
function getNodeClientOffset(node) {
  var el = node.nodeType === ELEMENT_NODE ? node : node.parentElement;

  if (!el) {
    return null;
  }

  var _el$getBoundingClient = el.getBoundingClientRect(),
      top = _el$getBoundingClient.top,
      left = _el$getBoundingClient.left;

  return { x: left, y: top };
}

function isRightClick(e) {
  if ('which' in e) {
    return e.which === 3;
  } else if ('button' in e) {
    return e.button === 2;
  }
  return false;
}

var MouseBackend = function () {
  function MouseBackend(manager) {
    _classCallCheck(this, MouseBackend);

    this.actions = manager.getActions();
    this.monitor = manager.getMonitor();
    this.registry = manager.getRegistry();

    this.sourceNodes = {};
    this.sourceNodesOptions = {};
    this.sourcePreviewNodes = {};
    this.sourcePreviewNodesOptions = {};
    this.targetNodes = {};
    this.targetNodeOptions = {};
    this.mouseClientOffset = {};

    this.getSourceClientOffset = this.getSourceClientOffset.bind(this);

    this.handleWindowMoveStart = this.handleWindowMoveStart.bind(this);
    this.handleWindowMoveStartCapture = this.handleWindowMoveStartCapture.bind(this);
    this.handleWindowMoveCapture = this.handleWindowMoveCapture.bind(this);
    this.handleWindowMoveEndCapture = this.handleWindowMoveEndCapture.bind(this);
    this.handleWindowClick = this.handleWindowClick.bind(this);
  }

  _createClass(MouseBackend, [{
    key: 'setup',
    value: function setup() {
      if (typeof window === 'undefined') {
        return;
      }

      if (this.constructor.isSetUp) {
        throw new Error('Cannot have two DnD Mouse backend at the same time');
      }

      this.constructor.isSetUp = true;
      window.addEventListener('mousedown', this.handleWindowMoveStartCapture, true);
      window.addEventListener('mousedown', this.handleWindowMoveStart);
      window.addEventListener('mousemove', this.handleWindowMoveCapture, true);
      window.addEventListener('mouseup', this.handleWindowMoveEndCapture, true);
      window.addEventListener('click', this.handleWindowClick, true);
    }
  }, {
    key: 'getSourceClientOffset',
    value: function getSourceClientOffset(sourceId) {
      return getNodeClientOffset(this.sourceNodes[sourceId]);
    }
  }, {
    key: 'teardown',
    value: function teardown() {
      if (typeof window === 'undefined') {
        return;
      }

      this.constructor.isSetUp = false;

      this.mouseClientOffset = {};
      window.removeEventListener('mousedown', this.handleWindowMoveStartCapture, true);
      window.removeEventListener('mousedown', this.handleWindowMoveStart);
      window.removeEventListener('mousemove', this.handleWindowMoveCapture, true);
      window.removeEventListener('mouseup', this.handleWindowMoveEndCapture, true);
      window.removeEventListener('click', this.handleWindowClick, true);
    }
  }, {
    key: 'connectDragSource',
    value: function connectDragSource(sourceId, node) {
      var _this = this;

      this.sourceNodes[sourceId] = node;

      var handleMoveStart = this.handleMoveStart.bind(this, sourceId);
      node.addEventListener('mousedown', handleMoveStart);

      return function () {
        delete _this.sourceNodes[sourceId];
        node.removeEventListener('mousedown', handleMoveStart);
      };
    }
  }, {
    key: 'connectDragPreview',
    value: function connectDragPreview(sourceId, node, options) {
      var _this2 = this;

      this.sourcePreviewNodesOptions[sourceId] = options;
      this.sourcePreviewNodes[sourceId] = node;

      return function () {
        delete _this2.sourcePreviewNodes[sourceId];
        delete _this2.sourcePreviewNodesOptions[sourceId];
      };
    }
  }, {
    key: 'connectDropTarget',
    value: function connectDropTarget(targetId, node) {
      var _this3 = this;

      this.targetNodes[targetId] = node;

      return function () {
        delete _this3.targetNodes[targetId];
      };
    }
  }, {
    key: 'handleWindowMoveStartCapture',
    value: function handleWindowMoveStartCapture() {
      this.moveStartSourceIds = [];
    }
  }, {
    key: 'handleMoveStart',
    value: function handleMoveStart(sourceId, e) {
      // Ignore right mouse button.
      if (isRightClick(e)) return;
      this.moveStartSourceIds.unshift(sourceId);
    }
  }, {
    key: 'handleWindowMoveStart',
    value: function handleWindowMoveStart(e) {
      var clientOffset = getEventClientOffset(e);
      if (clientOffset) {
        this.mouseClientOffset = clientOffset;
      }
    }
  }, {
    key: 'handleWindowMoveCapture',
    value: function handleWindowMoveCapture(e) {
      var _this4 = this;

      var moveStartSourceIds = this.moveStartSourceIds;

      var clientOffset = getEventClientOffset(e);
      if (!clientOffset) return;
      if (!this.monitor.isDragging() && this.mouseClientOffset.hasOwnProperty('x') && moveStartSourceIds && (this.mouseClientOffset.x !== clientOffset.x || this.mouseClientOffset.y !== clientOffset.y)) {
        this.moveStartSourceIds = null;
        this.actions.beginDrag(moveStartSourceIds, {
          clientOffset: this.mouseClientOffset,
          getSourceClientOffset: this.getSourceClientOffset,
          publishSource: false
        });
      }
      if (!this.monitor.isDragging()) {
        return;
      }

      var sourceNode = this.sourceNodes[this.monitor.getSourceId()];
      this.installSourceNodeRemovalObserver(sourceNode);

      this.actions.publishDragSource();

      e.preventDefault();

      var matchingTargetIds = Object.keys(this.targetNodes).filter(function (targetId) {
        var boundingRect = _this4.targetNodes[targetId].getBoundingClientRect();
        return clientOffset.x >= boundingRect.left && clientOffset.x <= boundingRect.right && clientOffset.y >= boundingRect.top && clientOffset.y <= boundingRect.bottom;
      });

      this.actions.hover(matchingTargetIds, {
        clientOffset: clientOffset
      });
    }
  }, {
    key: 'handleWindowMoveEndCapture',
    value: function handleWindowMoveEndCapture(e) {
      if (!this.monitor.isDragging() || this.monitor.didDrop()) {
        this.moveStartSourceIds = null;
        return;
      }
      this.preventClick = true;

      e.preventDefault();

      this.mouseClientOffset = {};

      this.uninstallSourceNodeRemovalObserver();
      this.actions.drop();
      this.actions.endDrag();
    }
  }, {
    key: 'handleWindowClick',
    value: function handleWindowClick(e) {
      if (this.preventClick) e.stopPropagation();
      this.preventClick = false;
    }
  }, {
    key: 'installSourceNodeRemovalObserver',
    value: function installSourceNodeRemovalObserver(node) {
      var _this5 = this;

      this.uninstallSourceNodeRemovalObserver();

      this.draggedSourceNode = node;
      this.draggedSourceNodeRemovalObserver = new window.MutationObserver(function () {
        if (!node.parentElement) {
          _this5.resurrectSourceNode();
          _this5.uninstallSourceNodeRemovalObserver();
        }
      });

      if (!node || !node.parentElement) {
        return;
      }

      this.draggedSourceNodeRemovalObserver.observe(node.parentElement, { childList: true });
    }
  }, {
    key: 'resurrectSourceNode',
    value: function resurrectSourceNode() {
      this.draggedSourceNode.style.display = 'none';
      this.draggedSourceNode.removeAttribute('data-reactid');
      document.body.appendChild(this.draggedSourceNode);
    }
  }, {
    key: 'uninstallSourceNodeRemovalObserver',
    value: function uninstallSourceNodeRemovalObserver() {
      if (this.draggedSourceNodeRemovalObserver) {
        this.draggedSourceNodeRemovalObserver.disconnect();
      }

      this.draggedSourceNodeRemovalObserver = null;
      this.draggedSourceNode = null;
    }
  }]);

  return MouseBackend;
}();

exports.default = MouseBackend;