"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _ramda = require("ramda");

var _parse5 = require("parse5");

var _parse52 = _interopRequireDefault(_parse5);

var _helpers = require("./helpers");

var _inline = require("./inline");

var _inline2 = _interopRequireDefault(_inline);

var isComment = function isComment(node) {
  return node.nodeName == "#comment";
};

var isText = function isText(node) {
  return node.nodeName == "#text";
};

var isTag = function isTag(node) {
  return !(isComment(node) || isText(node));
};

var isInline = function isInline(node) {
  return isTag(node) && (0, _ramda.contains)(node.tagName, _inline2["default"]);
};

var hasSelectorAttrs = function hasSelectorAttrs(node) {
  return (0, _helpers.filterNames)(["id", "className"], node.attrs).length > 0;
};

var hasNonSelectorAttrs = function hasNonSelectorAttrs(node) {
  return (0, _helpers.rejectNames)(["id", "className"], node.attrs).length > 0;
};

var hasChildren = function hasChildren(node) {
  var children = node.childNodes;
  return children && children.length > 0;
};

var normalizeAttrs = function normalizeAttrs(attrs) {
  var className = ((0, _helpers.findName)("class", attrs) || (0, _helpers.findName)("classname", attrs) || {}).value;
  var htmlFor = ((0, _helpers.findName)("for", attrs) || (0, _helpers.findName)("htmlfor", attrs) || {}).value;
  return (0, _ramda.pipe)(className ? (0, _helpers.addName)("className", className) : _ramda.identity, htmlFor ? (0, _helpers.addName)("htmlFor", htmlFor) : _ramda.identity)((0, _helpers.rejectNames)(["class", "classname", "for", "htmlfor"], attrs));
};

var attributesSelector = function attributesSelector(item) {
  switch (item.name) {
    case "id":
      return (0, _ramda.assoc)("id", item.value);
    case "style":
      return (0, _ramda.assoc)("style", item.value);
    default:
      return (0, _ramda.assocPath)(["attributes", item.name], item.value);
  }
};

// Object -> String -> [String, [String]]
var htmlToHs2 = (0, _ramda.curry)(function (opts, html) {
  opts = (0, _ramda.merge)({
    tabSize: 2,
    attributesSelector: attributesSelector,
    syntax: "hh" }, opts);

  // Get tree
  var nodes = _parse52["default"].parseFragment((0, _ramda.trim)(html)).childNodes;
  if (!nodes.length) {
    nodes = [{
      nodeName: "#text",
      value: html
    }];
  }

  // Closure-bound helpers
  var makeSpace = function makeSpace(depth) {
    var tab = (0, _ramda.join)("", (0, _ramda.repeat)(" ", opts.tabSize));
    return (0, _ramda.join)("", (0, _ramda.repeat)(tab, depth));
  };

  var renderSelector = function renderSelector(depth, node) {
    var id = ((0, _helpers.findName)("id", node.attrs) || {}).value;
    var className = ((0, _helpers.findName)("className", node.attrs) || {}).value;
    var idSelector = id ? "#" + id : "";
    var classSelector = className ? "." + (0, _ramda.join)(".", (0, _ramda.split)(" ", className)) : "";
    return idSelector + classSelector;
  };

  var renderProps = function renderProps(depth, node) {
    var space = makeSpace(depth);
    var attrs = node.attrs;

    var props = (0, _ramda.reduce)(function (memo, item) {
      return attributesSelector(item)(memo);
    }, {}, attrs);

    var json = JSON.stringify(props, null, 2);
    var rows = (0, _ramda.split)("\n", json);
    var shiftedRows = (0, _ramda.prepend)(rows[0], (0, _ramda.map)(function (row) {
      return space + row;
    }, (0, _ramda.drop)(1, rows)));
    return (0, _ramda.join)("\n", shiftedRows);
  };

  var renderTextNode = function renderTextNode(depth, node, i) {
    var space = makeSpace(depth);

    var leftNode = node.parentNode && node.parentNode.childNodes[i - 1];
    var rightNode = node.parentNode && node.parentNode.childNodes[i + 1];
    var keepLeftSpace = leftNode ? isInline(leftNode) : false;
    var keepRightSpace = rightNode ? isInline(rightNode) : false;

    var text = node.value;
    if (!keepLeftSpace) {
      text = (0, _ramda.replace)(/^\s+/, "", text);
    }
    if (!keepRightSpace) {
      text = (0, _ramda.replace)(/\s+$/, "", text);
    }

    if (text) {
      return space + "`" + text + "`";
    } else {
      return "";
    }
  };

  var renderCommentNode = function renderCommentNode(depth, node, i) {
    var space = makeSpace(depth);
    var comment = (0, _ramda.trim)(node.data);
    if (comment) {
      return space + "/* " + comment + " */";
    } else {
      return "";
    }
  };

  var renderTagNode = function renderTagNode(depth, node, i) {
    var space = makeSpace(depth);
    var selector = hasSelectorAttrs(node) && renderSelector(depth, node);
    var props = hasNonSelectorAttrs(node) && renderProps(depth, node);
    var children = hasChildren(node) && renderNodes(depth, node.childNodes);
    if (opts.syntax == "hh") {
      var quotedSelector = selector && "\"" + selector + "\"";
      return space + node.tagName + "(" + (0, _helpers.joinNonEmpty)([quotedSelector, props, children]) + ")";
    } else {
      var tagNameAndSelector = "\"" + node.tagName + (selector || "") + "\"";
      return space + "h(" + (0, _helpers.joinNonEmpty)([tagNameAndSelector, props, children]) + ")";
    }
  };

  // Main recursions
  var usedTagNames = new Set();

  var joinNodes = (0, _ramda.curry)(function (depth, nodes) {
    // Leading comments with first non-comment node
    var init = (0, _helpers.dropEmpty)((0, _ramda.append)((0, _ramda.dropWhile)(isComment, nodes)[0], (0, _ramda.takeWhile)(isComment, nodes)));

    // Other nodes
    var tail = (0, _ramda.drop)(1, (0, _ramda.dropWhile)(isComment, nodes));

    // Reduce
    return (0, _helpers.reduceIndexed)(function (memo, node, i) {
      var res = renderNode(depth, node, i + init.length);
      if (memo && res) {
        return memo + (isComment(node) ? "\n" : ",\n") + res;
      } else if (res) {
        return memo + res;
      } else {
        return memo;
      }
    }, (0, _ramda.join)("\n", (0, _helpers.mapIndexed)(renderNode(depth), init)), tail);
  });

  var renderNodes = (0, _ramda.curry)(function (depth, nodes) {
    if (nodes.length == 1 && isComment(nodes[0])) {
      return renderCommentNode(0, nodes[0], 0);
    } else if (nodes.length == 1 && isText(nodes[0])) {
      if (opts.syntax == "hh") {
        return "[" + renderTextNode(0, nodes[0], 0) + "]";
      } else {
        return renderTextNode(0, nodes[0], 0);
      }
    } else {
      var space = makeSpace(depth);
      return "[\n" + joinNodes(depth + 1, nodes) + "\n" + space + "]";
    }
  });

  var renderNode = (0, _ramda.curry)(function (depth, node, i) {
    if (isComment(node)) {
      return renderCommentNode(depth, node, i);
    } else if (isText(node)) {
      return renderTextNode(depth, node, i);
    } else {
      usedTagNames.add(node.tagName);
      var normNode = (0, _ramda.assoc)("attrs", normalizeAttrs(node.attrs), node);
      return renderTagNode(depth, normNode, i);
    }
  });

  // Fire things
  if (nodes.length == 1) {
    return [renderNode(0, nodes[0], 0), (0, _helpers.commonSort)(Array.from(usedTagNames))];
  } else {
    return [renderNodes(0, nodes), (0, _helpers.commonSort)(Array.from(usedTagNames))];
  }
});

// Object -> String -> String
var htmlToHs = (0, _ramda.curry)(function (opts, html) {
  return htmlToHs2(opts, html)[0];
});

exports["default"] = {
  htmlToHs: htmlToHs,
  htmlToHs2: htmlToHs2
};
module.exports = exports["default"];
// "h" / "hh"