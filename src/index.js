let {assoc, assocPath, append, contains, curry, drop, dropWhile, identity, join, keys} = require("ramda")
let {map, merge, pipe, prepend, split, reduce, repeat, replace, takeWhile, trim} = require("ramda")
let parse5 = require("parse5")
let {mapIndexed, reduceIndexed, dropEmpty, joinNonEmpty, commonSort, filterNames, rejectNames, findName, addName} = require("./helpers")
let inline = require("./inline")

let isComment = (node => node.nodeName == "#comment")

let isText = (node => node.nodeName == "#text")

let isTag = (node => !(isComment(node) || isText(node)))

let isInline = (node => isTag(node) && contains(node.tagName, inline))

let hasSelectorAttrs = function (node) {
  return filterNames(["id", "className"], node.attrs).length > 0
}

let hasNonSelectorAttrs = function (node) {
  return rejectNames(["id", "className"], node.attrs).length > 0
}

let hasChildren = function (node) {
  let children = node.childNodes
  return children && children.length > 0
}

let normalizeAttrs = function (attrs) {
  let className = (findName("class", attrs) || findName("classname", attrs) || {}).value
  let htmlFor = (findName("for", attrs) || findName("htmlfor", attrs) || {}).value
  return pipe(
    className ? addName("className", className) : identity,
    htmlFor   ? addName("htmlFor", htmlFor)     : identity
  )(rejectNames(["class", "classname", "for", "htmlfor"], attrs))
}

let attributesSelector = (item) => {
  switch (item.name) {
    case "id":    return assoc("id", item.value)
    case "style": return assoc("style", item.value)
    default:      return assocPath(["attributes", item.name], item.value)
  }
}

// Object -> String -> [String, [String]]
let htmlToHs2 = curry((opts, html) => {
  opts = merge({
    tabSize: 2,
    attributesSelector,
    syntax: "hh", // "h" / "hh"
  }, opts)

  // Get tree
  let nodes = parse5.parseFragment(trim(html)).childNodes
  if (!nodes.length) {
    nodes = [{
      nodeName: "#text",
      value: html,
    }]
  }

  // Closure-bound helpers
  let makeSpace = function (depth) {
    let tab = join("", repeat(" ", opts.tabSize))
    return join("", repeat(tab, depth))
  }

  let renderSelector = function (depth, node) {
    let id = (findName("id", node.attrs) || {}).value
    let className = (findName("className", node.attrs) || {}).value
    let idSelector = id ? "#" + id : ""
    let classSelector = className ? "." + join(".", split(" ", className)) : ""
    return idSelector + classSelector
  }

  let renderProps = function (depth, node) {
    let space = makeSpace(depth)
    let attrs = node.attrs

    let props = reduce((memo, item) => opts.attributesSelector(item)(memo), {}, attrs)

    let json = JSON.stringify(props, null, 2)
    let rows = split("\n", json)
    let shiftedRows = prepend(rows[0], map(row => space + row, drop(1, rows)))
    return join("\n", shiftedRows)
  }

  let renderTextNode = function (depth, node, i) {
    let space = makeSpace(depth)

    let leftNode = node.parentNode && node.parentNode.childNodes[i - 1]
    let rightNode = node.parentNode && node.parentNode.childNodes[i + 1]
    let keepLeftSpace = leftNode ? isInline(leftNode) : false
    let keepRightSpace = rightNode ? isInline(rightNode) : false

    let text = node.value
    if (!keepLeftSpace) {
      text = replace(/^\s+/, "", text)
    }
    if (!keepRightSpace) {
      text = replace(/\s+$/, "", text)
    }

    if (text) {
      return space + '`' + text + '`'
    } else {
      return ""
    }
  }

  let renderCommentNode = function (depth, node, i) {
    let space = makeSpace(depth)
    let comment = trim(node.data)
    if (comment) {
      return space + "/* " + comment + " */"
    } else {
      return ""
    }
  }

  let renderTagNode = function (depth, node, i) {
    let space = makeSpace(depth)
    let selector = hasSelectorAttrs(node) && renderSelector(depth, node)
    let props = hasNonSelectorAttrs(node) && renderProps(depth, node)
    let children = hasChildren(node) && renderNodes(depth, node.childNodes)
    if (opts.syntax == "hh") {
      let quotedSelector = selector && '"' + selector + '"'
      return space + node.tagName + "(" + joinNonEmpty([quotedSelector, props, children]) + ")"
    } else {
      let tagNameAndSelector = '"' + node.tagName + (selector || "") + '"'
      return space + "h(" + joinNonEmpty([tagNameAndSelector, props, children]) + ")"
    }
  }

  // Main recursions
  let usedTagNames = new Set()

  let joinNodes = curry((depth, nodes) => {
    // Leading comments with first non-comment node
    let init = dropEmpty(append(dropWhile(isComment, nodes)[0], takeWhile(isComment, nodes)))

    // Other nodes
    let tail = drop(1, dropWhile(isComment, nodes))

    // Reduce
    return reduceIndexed((memo, node, i) => {
      let res = renderNode(depth, node, i + init.length)
      if (memo && res) {
        return memo + (isComment(node) ? "\n" : ",\n") + res
      } else if (res) {
        return memo + res
      } else {
        return memo
      }
    }, join("\n", mapIndexed(renderNode(depth), init)), tail)
  })

  let renderNodes = curry((depth, nodes) => {
    if (nodes.length == 1 && isComment(nodes[0])) {
      return renderCommentNode(0, nodes[0], 0)
    } else if (nodes.length == 1 && isText(nodes[0])) {
      if (opts.syntax == "hh") {
        return "[" + renderTextNode(0, nodes[0], 0) + "]"
      } else {
        return renderTextNode(0, nodes[0], 0)
      }
    } else {
      let space = makeSpace(depth)
      return "[\n" + joinNodes(depth + 1, nodes) + "\n" + space + "]"
    }
  })

  let renderNode = curry((depth, node, i) => {
    if (isComment(node)) {
      return renderCommentNode(depth, node, i)
    } else if (isText(node)) {
      return renderTextNode(depth, node, i)
    } else {
      usedTagNames.add(node.tagName)
      let normNode = assoc("attrs", normalizeAttrs(node.attrs), node)
      return renderTagNode(depth, normNode, i)
    }
  })

  // Fire things
  if (nodes.length == 1) {
    return [renderNode(0, nodes[0], 0), commonSort(Array.from(usedTagNames))]
  } else {
    return [renderNodes(0, nodes), commonSort(Array.from(usedTagNames))]
  }
})

// Object -> String -> String
let htmlToHs = curry((opts, html) => {
  return htmlToHs2(opts, html)[0]
})

exports.htmlToHs = htmlToHs
exports.htmlToHs2 = htmlToHs2
