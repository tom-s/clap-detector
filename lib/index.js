"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _get = _interopRequireDefault(require("lodash/get"));

var _size = _interopRequireDefault(require("lodash/size"));

var _first = _interopRequireDefault(require("lodash/first"));

var _last = _interopRequireDefault(require("lodash/last"));

var _omit = _interopRequireDefault(require("lodash/omit"));

var _maxBy = _interopRequireDefault(require("lodash/maxBy"));

var _isEmpty = _interopRequireDefault(require("lodash/isEmpty"));

var _orderBy = _interopRequireDefault(require("lodash/orderBy"));

var _uniqueid = _interopRequireDefault(require("lodash/uniqueid"));

var _takeRight = _interopRequireDefault(require("lodash/takeRight"));

var _assign = _interopRequireDefault(require("lodash/assign"));

var _child_process = require("child_process");

var _fs = _interopRequireDefault(require("fs"));

var _appRootPath = _interopRequireDefault(require("app-root-path"));

var _os = _interopRequireDefault(require("os"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) 2015 Thomas Schell (https://github.com/tom-s)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to dealFWAV_
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:



 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.



 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */
const CONFIG = {
  AUDIO_SOURCE: _os.default.type() === "Darwin" // microphone
  ? 'coreaudio default' : 'alsa hw:1,0',
  DETECTION_PERCENTAGE_START: '10%',
  DETECTION_PERCENTAGE_END: '10%',
  CLAP_AMPLITUDE_THRESHOLD: 0.7,
  CLAP_ENERGY_THRESHOLD: 0.3,
  CLAP_MAX_DURATION: 1500,
  MAX_HISTORY_LENGTH: 100 // no need to maintain big history

};

const parseOutput = body => {
  body = body.replace(new RegExp("[ \\t]+", "g"), " "); //sox use spaces to align output

  const split = new RegExp("^(.*):\\s*(.*)$", "mg");
  let match = '';
  let dict = {}; //simple key:value

  while (match = split.exec(body)) dict[match[1]] = parseFloat(match[2]);

  return dict;
};

class ClapDetector {
  constructor(props) {
    this.config = { ...CONFIG,
      ...props
    };
    this.clapsHistory = [];
    this.cbs = {};
    this.timeout = null; // Start listening

    this.listen();
  }

  isClap(stats) {
    const {
      CLAP_MAX_DURATION,
      CLAP_AMPLITUDE_THRESHOLD,
      CLAP_ENERGY_THRESHOLD
    } = this.config;
    const duration = (0, _get.default)(stats, 'Length (seconds)');
    const rms = (0, _get.default)(stats, 'RMS amplitude');
    const max = (0, _get.default)(stats, 'Maximum amplitude');
    return duration < CLAP_MAX_DURATION && max > CLAP_AMPLITUDE_THRESHOLD && rms < CLAP_ENERGY_THRESHOLD;
  }

  handleClap() {
    const {
      MAX_HISTORY_LENGTH
    } = this.config; // Add clap to history

    this.clapsHistory.push({
      id: (0, _size.default)(this.clapsHistory),
      time: new Date().getTime()
    }); // Trigger callbacks

    const waitDelay = (0, _get.default)((0, _maxBy.default)(Object.values(this.cbs), cb => cb.delay), 'delay', 0);
    this.timeout && clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.triggerCallback(), waitDelay + 100);
    this.triggerCallback(true); // No need to maintain a big history

    this.clapsHistory = (0, _takeRight.default)(this.clapsHistory, MAX_HISTORY_LENGTH);
  }

  triggerCallback(force = false) {
    const forceCallbacks = (0, _orderBy.default)(Object.values(this.cbs), 'number', 'desc').filter(cb => cb.force === force);
    const triggerCallbacks = forceCallbacks.reduce((memo, cb) => {
      const claps = (0, _takeRight.default)(this.clapsHistory, cb.number); // Check that the delay between the last clap and the first is inferior to what was requested by user

      const lastClap = (0, _last.default)(claps);
      const firstClap = (0, _first.default)(claps);
      const delay = lastClap.time - firstClap.time;
      const clapsDetected = (0, _size.default)(claps) === cb.number && delay <= cb.delay;
      clapsDetected && memo.push({
        fn: cb.fn,
        claps
      });
      return memo;
    }, []);
    const filteredTriggerCallbacks = force ? triggerCallbacks : [(0, _first.default)(triggerCallbacks)];
    filteredTriggerCallbacks.forEach(({
      fn,
      claps
    }) => fn(claps));
  }

  listen() {
    try {
      const {
        MAX_HISTORY_LENGTH,
        AUDIO_SOURCE,
        DETECTION_PERCENTAGE_START,
        DETECTION_PERCENTAGE_END
      } = this.config;
      const filename = _appRootPath.default + '/input.wav'; // Listen for sound

      const cmd = 'sox -t ' + AUDIO_SOURCE + ' ' + filename + ' silence 1 0.0001 ' + DETECTION_PERCENTAGE_START + ' 1 0.1 ' + DETECTION_PERCENTAGE_END + ' −−no−show−progress stat';
      let body = '';
      const child = (0, _child_process.exec)(cmd, err => {
        if (err) {
          throw err;
          return;
        }
      });
      child.stderr.on("data", buf => {
        body += buf;
      });
      child.on("exit", () => {
        const stats = parseOutput(body);
        this.isClap(stats) && this.handleClap();
        this.listen(); // listen again
      });
    } catch (e) {
      console.error("caught error", e);
    }
  }

  addClapsListener(fn = () => {}, options = {}) {
    const {
      number = 1,
      delay = 1000,
      force = false
    } = options;
    const listenerId = (0, _uniqueid.default)();
    this.cbs = { ...this.cbs,
      [listenerId]: {
        id: listenerId,
        fn,
        number,
        delay,
        force
      }
    };

    const release = () => {
      this.cbs = (0, _omit.default)(this.cbs, [listenerId]);
    };

    return release;
  }

}

var _default = ClapDetector;
exports.default = _default;