let addIndex = require("ramda/src/addIndex")
let append = require("ramda/src/append")
let contains = require("ramda/src/contains")
let curry = require("ramda/src/curry")
let filter = require("ramda/src/filter")
let find = require("ramda/src/find")
let identity = require("ramda/src/identity")
let join = require("ramda/src/join")
let map = require("ramda/src/map")
let pipe = require("ramda/src/pipe")
let reduce = require("ramda/src/reduce")
let reject = require("ramda/src/reject")
let sortBy = require("ramda/src/sortBy")

let mapI = addIndex(map)

let reduceI = addIndex(reduce)

let dropEmpty = filter(identity)

let joinNonEmpty = pipe(dropEmpty, join(", "))

let commonSort = sortBy(identity)

let filterByNames = curry((names, attrs) => {
  return filter(attr => contains(attr.name, names), attrs)
})

let rejectByNames = curry((names, attrs) => {
  return reject(attr => contains(attr.name, names), attrs)
})

let findByName = curry((name, attrs) => {
  return find(attr => attr.name == name, attrs)
})

exports.mapI = mapI
exports.reduceI = reduceI
exports.dropEmpty = dropEmpty
exports.joinNonEmpty = joinNonEmpty
exports.commonSort = commonSort
exports.filterByNames = filterByNames
exports.rejectByNames = rejectByNames
exports.findByName = findByName
