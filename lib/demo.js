"use strict";

var _index = _interopRequireDefault(require("./index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Test
const clap = new _index.default();
const disposableOneClapListener = clap.addClapsListener(claps => {
  console.log("heard 1 clap (force)", claps);
}, {
  number: 1,
  delay: 0,
  force: true
});
const disposableOneClapForceListener = clap.addClapsListener(claps => {
  console.log("heard 1 clap", claps);
}, {
  number: 1,
  delay: 1000
});
const disposableTwoClapsListener = clap.addClapsListener(claps => {
  console.log("heard 2 claps", claps);
}, {
  number: 2,
  delay: 1000
});
const disposableThreeClapsListener = clap.addClapsListener(claps => {
  console.log("heard 3 claps", claps);
}, {
  number: 3,
  delay: 1000
}); // Example: cancel some clap listeners
// Cancel alls claps listener but 2 claps after 10 seconds

setTimeout(() => {
  console.log("only listen to 2 claps now");
  disposableOneClapListener();
  disposableOneClapForceListener();
  disposableThreeClapsListener();
}, 10000); // Example: dispose (stop sox process) after 30s

setTimeout(() => {
  console.log("dispose all listeners and free ressources");
  clap.dispose();
}, 30000);