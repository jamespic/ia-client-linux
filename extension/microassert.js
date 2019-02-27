class AssertionError extends Error {}

function assert(expr, message) {
  if (!expr) throw new AssertionError(message)
}

assert.equal = function equal(a, b, optMessage=null) {
  assert(a === b, optMessage || `${a} !== ${b}`)
}

assert.notEqual = function notEqual(a, b, optMessage=null) {
  assert(a !== b, optMessage || `${a} === ${b}`)
}

assert.ok = function ok(x, optMessage) {
  assert(!!x === true, optMessage || `${a} is not truthy`)
}

assert.default = assert

module.exports = assert
