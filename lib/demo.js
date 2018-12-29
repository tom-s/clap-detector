"use strict";

var _index = _interopRequireDefault(require("./index"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Test
const clap = new _index.default();
const release = clap.addClapListener(props => {
  console.log("debug clap !", props);
}); // No more clap listener after 3000 ms

setTimeout(() => release(), 3000);