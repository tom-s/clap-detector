"use strict";

var _index = _interopRequireDefault(require("./index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Test
const clap = new _index.default();
const cancelOneClapListener = clap.addClapsListener(claps => {
  console.log("heard 1 clap (force)", claps);
}, {
  number: 1,
  delay: 0,
  force: true
});
const cancelOneClapForceListener = clap.addClapsListener(claps => {
  console.log("heard 1 clap", claps);
}, {
  number: 1,
  delay: 1000
});
const cancelTwoClapsListener = clap.addClapsListener(claps => {
  console.log("heard 2 claps", claps);
}, {
  number: 2,
  delay: 1000
});
const cancelThreeClapsListener = clap.addClapsListener(claps => {
  console.log("heard 3 claps", claps);
}, {
  number: 3,
  delay: 1000
}); // Example: canceling clap listeners
// Cancel alls claps listener but 2 claps after 10 seconds

setTimeout(() => {
  console.log("only listen to 2 claps now");
  cancelOneClapListener();
  cancelOneClapForceListener();
  cancelThreeClapsListener();
}, 10000);