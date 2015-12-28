"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ramda = require("ramda");

var mapIndexed = (0, _ramda.addIndex)(_ramda.map);

var reduceIndexed = (0, _ramda.addIndex)(_ramda.reduce);

var dropEmpty = (0, _ramda.filter)(_ramda.identity);

var joinNonEmpty = (0, _ramda.pipe)(dropEmpty, (0, _ramda.join)(", "));

var commonSort = (0, _ramda.sortBy)(_ramda.identity);

var filterNames = (0, _ramda.curry)(function (names, attrs) {
  return (0, _ramda.filter)(function (attr) {
    return (0, _ramda.contains)(attr.name, names);
  }, attrs);
});

var rejectNames = (0, _ramda.curry)(function (names, attrs) {
  return (0, _ramda.reject)(function (attr) {
    return (0, _ramda.contains)(attr.name, names);
  }, attrs);
});

var findName = (0, _ramda.curry)(function (name, attrs) {
  return (0, _ramda.find)(function (attr) {
    return attr.name == name;
  }, attrs);
});

var addName = (0, _ramda.curry)(function (name, value, attrs) {
  return (0, _ramda.append)({ name: name, value: value }, attrs);
});

exports["default"] = {
  mapIndexed: mapIndexed, reduceIndexed: reduceIndexed,
  dropEmpty: dropEmpty, joinNonEmpty: joinNonEmpty, commonSort: commonSort,
  filterNames: filterNames, rejectNames: rejectNames, findName: findName, addName: addName
};
module.exports = exports["default"];