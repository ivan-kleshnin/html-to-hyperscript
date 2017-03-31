"use strict";

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

var mapI = addIndex(map);

var reduceI = addIndex(reduce);

var dropEmpty = filter(identity);

var joinNonEmpty = pipe(dropEmpty, join(", "));

var commonSort = sortBy(identity);

var filterByNames = curry(function (names, attrs) {
  return filter(function (attr) {
    return contains(attr.name, names);
  }, attrs);
});

var rejectByNames = curry(function (names, attrs) {
  return reject(function (attr) {
    return contains(attr.name, names);
  }, attrs);
});

var findByName = curry(function (name, attrs) {
  return find(function (attr) {
    return attr.name == name;
  }, attrs);
});

exports.mapI = mapI;
exports.reduceI = reduceI;
exports.dropEmpty = dropEmpty;
exports.joinNonEmpty = joinNonEmpty;
exports.commonSort = commonSort;
exports.filterByNames = filterByNames;
exports.rejectByNames = rejectByNames;
exports.findByName = findByName;