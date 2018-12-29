"use strict";

var _index = _interopRequireDefault(require("./index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Test
const clap = new _index.default();
const listeners = [clap.addClapListener(props => {
  console.log("debug 1 clap force", props);
}, {
  number: 1,
  delay: 0,
  force: true
}), clap.addClapListener(props => {
  console.log("debug 1 clap", props);
}, {
  number: 1,
  delay: 1000
}), clap.addClapListener(props => {
  console.log("debug 2 claps", props);
}, {
  number: 2,
  delay: 1000
}), clap.addClapListener(props => {
  console.log("debug 3 claps", props);
}, {
  number: 3,
  delay: 1000
})]; // No more clap listener after 3000 ms

/*
setTimeout(() => {
  listeners.forEach(release => release())
}, 3000)
*/