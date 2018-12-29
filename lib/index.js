"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

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
const clapDetector = (() => {
  /* DEFAULT CONFIG */
  var CONFIG = {
    AUDIO_SOURCE: _os.default.type() === "Darwin" // microphone
    ? 'coreaudio default' : 'alsa hw:1,0',
    DETECTION_PERCENTAGE_START: '10%',
    DETECTION_PERCENTAGE_END: '10%',
    CLAP_AMPLITUDE_THRESHOLD: 0.7,
    CLAP_ENERGY_THRESHOLD: 0.3,
    CLAP_MAX_DURATION: 1500,
    MAX_HISTORY_LENGTH: 10 // no need to maintain big history

  };
  var paused = false;
  /* Callback for events */

  var EVENTS = {
    clap: {
      fn: null
    },
    multipleClaps: []
  };
  /* History of claps */

  var clapsHistory = [];

  function _handleMultipleClapsEvent(props) {
    // Retrieve latest claps
    var latestClaps = _lodash.default.takeRight(clapsHistory, props.num);

    if (latestClaps.length === props.num) {
      // Check that the delay between the last clap and the first is inferior to what was requested by user
      var lastClap = _lodash.default.last(latestClaps);

      var firstClap = _lodash.default.first(latestClaps);

      var delay = lastClap.time - firstClap.time;

      if (delay < props.maxDelay) {
        props.fn(delay);
      }
    }
  }
  /* Check if multiple claps have been done */


  function _handleMultipleClaps() {
    // If callback registered, handle them
    if (EVENTS.multipleClaps.length > 0) {
      _lodash.default.forEach(EVENTS.multipleClaps, function (cbProps) {
        _handleMultipleClapsEvent(cbProps);
      });
    }
  }
  /* Listen */


  function _listen() {
    var args = [];
    var body = '';
    var filename = _appRootPath.default + '/input.wav'; // Listen for sound

    var cmd = 'sox -t ' + CONFIG.AUDIO_SOURCE + ' ' + filename + ' silence 1 0.0001 ' + CONFIG.DETECTION_PERCENTAGE_START + ' 1 0.1 ' + CONFIG.DETECTION_PERCENTAGE_END + ' −−no−show−progress stat';
    var child = (0, _child_process.exec)(cmd);
    child.stderr.on("data", function (buf) {
      body += buf;
    });
    child.on("exit", function () {
      var stats = _parse(body);

      if (_isClap(stats)) {
        clapsHistory.push({
          id: clapsHistory.length ? _lodash.default.last(clapsHistory, 1).id + 1 : 1,
          time: new Date().getTime()
        }); // Clean history

        clapsHistory = _lodash.default.takeRight(clapsHistory, CONFIG.MAX_HISTORY_LENGTH); // no need to maintain a big history

        if (EVENTS.clap.fn) {
          EVENTS.clap.fn(clapsHistory);
        }

        _handleMultipleClaps();
      }

      _listen(); // listen again

    });
  }

  function _isClap(stats) {
    var duration = stats['Length (seconds)'],
        rms = stats['RMS amplitude'],
        max = stats['Maximum amplitude'];
    return duration < CONFIG.CLAP_MAX_DURATION && max > CONFIG.CLAP_AMPLITUDE_THRESHOLD && rms < CONFIG.CLAP_ENERGY_THRESHOLD;
  }

  function _parse(body) {
    body = body.replace(new RegExp("[ \\t]+", "g"), " "); //sox use spaces to align output

    var split = new RegExp("^(.*):\\s*(.*)$", "mg"),
        match,
        dict = {}; //simple key:value

    while (match = split.exec(body)) dict[match[1]] = parseFloat(match[2]);

    return dict;
  }

  function _config(props) {
    if (props) {
      _lodash.default.assign(CONFIG, props);
    }
  }

  return {
    start: function (props) {
      _config(props); // Start listening


      _listen();
    },
    //1 clap
    onClap: function (cb) {
      if (cb) {
        EVENTS.clap.fn = cb;
      }
    },
    // multiples claps
    onClaps: function (num, maxDelay, cb) {
      if (num && maxDelay && cb) {
        EVENTS.multipleClaps.push({
          num: num,
          maxDelay: maxDelay,
          fn: cb
        });
      }
    },
    // pause
    pause: function () {
      paused = true;
    },
    // resume
    resume: function () {
      paused = false;
    },
    // updateConfig
    updateConfig: function (props) {
      _config(props);
    }
  };
})();

var _default = clapDetector;
exports.default = _default;