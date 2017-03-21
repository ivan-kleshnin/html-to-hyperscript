var addIndex = require("ramda/src/addIndex");
var append = require("ramda/src/append");
var contains = require("ramda/src/contains");
var curry = require("ramda/src/curry");
var filter = require("ramda/src/filter");
var find = require("ramda/src/find");
var identity = require("ramda/src/identity");
var join = require("ramda/src/join");
var map = require("ramda/src/map");
var pipe = require("ramda/src/pipe");
var reduce = require("ramda/src/reduce");
var reject = require("ramda/src/reject");
var sortBy = require("ramda/src/sortBy");

// let {addIndex, append, contains, curry, filter, find, identity, join, map, pipe, reduce, reject, sortBy} = require("ramda")

let mapIndexed = addIndex(map)

let reduceIndexed = addIndex(reduce)

let dropEmpty = filter(identity)

let joinNonEmpty = pipe(dropEmpty, join(", "))

let commonSort = sortBy(identity)

let filterNames = curry((names, attrs) => {
  return filter(attr => contains(attr.name, names), attrs)
})

let rejectNames = curry((names, attrs) => {
  return reject(attr => contains(attr.name, names), attrs)
})

let findName = curry((name, attrs) => {
  return find(attr => attr.name == name, attrs)
})

let addName = curry((name, value, attrs) => {
  return append({name, value}, attrs)
})

exports.mapIndexed = mapIndexed
exports.reduceIndexed = reduceIndexed
exports.dropEmpty = dropEmpty
exports.joinNonEmpty = joinNonEmpty
exports.commonSort = commonSort
exports.filterNames = filterNames
exports.rejectNames = rejectNames
exports.findName = findName
exports.addName = addName
