"use strict";

var assoc = require("ramda/src/assoc");
var assocPath = require("ramda/src/assocPath");
var append = require("ramda/src/append");
var contains = require("ramda/src/contains");
var curry = require("ramda/src/curry");
var drop = require("ramda/src/drop");
var dropWhile = require("ramda/src/dropWhile");
var identity = require("ramda/src/identity");
var join = require("ramda/src/join");
var keys = require("ramda/src/keys");
var map = require("ramda/src/map");
var merge = require("ramda/src/merge");
var pipe = require("ramda/src/pipe");
var prepend = require("ramda/src/prepend");
var split = require("ramda/src/split");
var reduce = require("ramda/src/reduce");
var repeat = require("ramda/src/repeat");
var replace = require("ramda/src/replace");
var takeWhile = require("ramda/src/takeWhile");
var trim = require("ramda/src/trim");
var parse5 = require("parse5");

var _require = require("./helpers"),
    mapI = _require.mapI,
    reduceI = _require.reduceI,
    dropEmpty = _require.dropEmpty,
    joinNonEmpty = _require.joinNonEmpty,
    commonSort = _require.commonSort,
    filterByNames = _require.filterByNames,
    rejectByNames = _require.rejectByNames,
    findByName = _require.findByName;

var inline = require("./inline");

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
  return isTag(node) && contains(node.tagName, inline);
};

var hasSelectorAttrs = function hasSelectorAttrs(node) {
  return filterByNames(["id", "className"], node.attrs).length > 0;
};

var hasNonSelectorAttrs = function hasNonSelectorAttrs(node) {
  return rejectByNames(["id", "className"], node.attrs).length > 0;
};

var hasChildren = function hasChildren(node) {
  return node.childNodes && node.childNodes.length > 0;
};

var normalizeAttrs = function normalizeAttrs(attrs) {
  var className = (findByName("class", attrs) || findByName("classname", attrs) || {}).value;
  var htmlFor = (findByName("for", attrs) || findByName("htmlfor", attrs) || {}).value;
  return pipe(className ? append({ name: "className", value: className }) : identity, htmlFor ? append({ name: "htmlFor", value: htmlFor }) : identity)(rejectByNames(["class", "classname", "for", "htmlfor"], attrs));
};

var CSSRuleTextToObject = function CSSRuleTextToObject(CSSText) {
  var regex = /([\w-]*)\s*:\s*([^;]*)/g;
  var match = void 0;
  var obj = {};
  while (match = regex.exec(CSSText)) {
    obj[match[1]] = match[2].trim();
  }
  return obj;
};

var attributesSelector = function attributesSelector(item) {
  switch (item.name) {
    case "id":
      return assoc("id", item.value);
    case "style":
      return assoc("style", CSSRuleTextToObject(item.value));
    default:
      return assocPath(["attributes", item.name], item.value);
  }
};

// Object -> String -> [String, [String]]
var htmlToHs2 = curry(function (opts, html) {
  opts = merge({
    tabSize: 2,
    attributesSelector: attributesSelector,
    syntax: "hh" }, opts);

  // Get tree
  var nodes = parse5.parseFragment(trim(html)).childNodes;
  if (!nodes.length) {
    nodes = [{
      nodeName: "#text",
      value: html
    }];
  }

  // Closure-bound helpers
  var makeSpace = function makeSpace(depth) {
    var tab = join("", repeat(" ", opts.tabSize));
    return join("", repeat(tab, depth));
  };

  var renderSelector = function renderSelector(depth, node) {
    var id = (findByName("id", node.attrs) || {}).value;
    var className = (findByName("className", node.attrs) || {}).value;
    var idSelector = id ? "#" + id : "";
    var classSelector = className ? "." + join(".", split(" ", className)) : "";
    return idSelector + classSelector;
  };

  var renderProps = function renderProps(depth, node) {
    var space = makeSpace(depth);
    var attrs = node.attrs;

    var props = reduce(function (z, x) {
      return opts.attributesSelector(x)(z);
    }, {}, attrs);

    var json = JSON.stringify(props, null, 2);
    var rows = split("\n", json);
    var shiftedRows = prepend(rows[0], map(function (row) {
      return space + row;
    }, drop(1, rows)));
    return join("\n", shiftedRows);
  };

  var renderTextNode = function renderTextNode(depth, node, i) {
    var space = makeSpace(depth);

    var leftNode = node.parentNode && node.parentNode.childNodes[i - 1];
    var rightNode = node.parentNode && node.parentNode.childNodes[i + 1];
    var keepLeftSpace = leftNode ? isInline(leftNode) : false;
    var keepRightSpace = rightNode ? isInline(rightNode) : false;

    var text = node.value;
    if (!keepLeftSpace) {
      text = replace(/^\s+/, "", text);
    }
    if (!keepRightSpace) {
      text = replace(/\s+$/, "", text);
    }

    if (text) {
      return space + '`' + text + '`';
    } else {
      return "";
    }
  };

  var renderCommentNode = function renderCommentNode(depth, node, i) {
    var space = makeSpace(depth);
    var comment = trim(node.data);
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
      var quotedSelector = selector && '"' + selector + '"';
      return space + node.tagName + "(" + joinNonEmpty([quotedSelector, props, children]) + ")";
    } else {
      var tagNameAndSelector = '"' + node.tagName + (selector || "") + '"';
      return space + "h(" + joinNonEmpty([tagNameAndSelector, props, children]) + ")";
    }
  };

  // Main recursions
  var usedTagNames = new Set();

  var joinNodes = curry(function (depth, nodes) {
    // Leading comments with first non-comment node
    var init = dropEmpty(append(dropWhile(isComment, nodes)[0], takeWhile(isComment, nodes)));

    // Other nodes
    var tail = drop(1, dropWhile(isComment, nodes));

    // Reduce
    return reduceI(function (memo, node, i) {
      var res = renderNode(depth, node, i + init.length);
      if (memo && res) {
        return memo + (isComment(node) ? "\n" : ",\n") + res;
      } else if (res) {
        return memo + res;
      } else {
        return memo;
      }
    }, join("\n", mapI(renderNode(depth), init)), tail);
  });

  var renderNodes = curry(function (depth, nodes) {
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

  var renderNode = curry(function (depth, node, i) {
    if (isComment(node)) {
      return renderCommentNode(depth, node, i);
    } else if (isText(node)) {
      return renderTextNode(depth, node, i);
    } else {
      usedTagNames.add(node.tagName);
      var normNode = assoc("attrs", normalizeAttrs(node.attrs), node);
      return renderTagNode(depth, normNode, i);
    }
  });

  // Fire things
  if (nodes.length == 1) {
    return [renderNode(0, nodes[0], 0), commonSort(Array.from(usedTagNames))];
  } else {
    return [renderNodes(0, nodes), commonSort(Array.from(usedTagNames))];
  }
});

// Object -> String -> String
var htmlToHs = curry(function (opts, html) {
  return htmlToHs2(opts, html)[0];
});

exports.htmlToHs = htmlToHs;
exports.htmlToHs2 = htmlToHs2;