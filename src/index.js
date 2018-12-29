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

import get from 'lodash/get'
import size from 'lodash/size'
import last from 'lodash/last'
import omit from 'lodash/omit'
import uniqueid from 'lodash/uniqueid'
import takeRight from 'lodash/takeRight'
import assign from 'lodash/assign'
import { exec } from 'child_process'
import fs from 'fs'
import appRoot from 'app-root-path'
import os from 'os'

const CONFIG = {
  AUDIO_SOURCE: os.type() === "Darwin" // microphone
  ? 'coreaudio default'
  : 'alsa hw:1,0',
  DETECTION_PERCENTAGE_START : '10%',
  DETECTION_PERCENTAGE_END: '10%',
  CLAP_AMPLITUDE_THRESHOLD: 0.7,
  CLAP_ENERGY_THRESHOLD: 0.3,
  CLAP_MAX_DURATION: 1500,
  MAX_HISTORY_LENGTH: 10 // no need to maintain big history
}

const parseOutput = body => {
  body = body.replace(new RegExp("[ \\t]+", "g") , " ") //sox use spaces to align output
  const split = new RegExp("^(.*):\\s*(.*)$", "mg"), match, dict = {} //simple key:value
  while(match = split.exec(body)) dict[match[1]] = parseFloat(match[2])
  return dict
}

class ClapDetector {
  constructor(props) {
    this.config = {
      ...CONFIG,
      ...props
    }
    this.paused = false
    this.clapsHistory = []
    this.cbs = {}
    // Start listening
    this.listen()
  }

  isClap = stats => {
    const { CLAP_MAX_DURATION, CLAP_AMPLITUDE_THRESHOLD, CLAP_ENERGY_THRESHOLD } = this.config
    const duration = get(stats, 'Length (seconds)')
    const rms = get(stats, 'RMS amplitude')
    const max = get(stats, 'Maximum amplitude')
    return (duration < CLAP_MAX_DURATION && max > CLAP_AMPLITUDE_THRESHOLD && rms < CLAP_ENERGY_THRESHOLD)
  }

  handleClap = () => {
    console.log("debug handleClap", this.cbs)
    // Add clap to history
    this.clapsHistory.push({
      id : size(this.clapsHistory)
      time: new Date().getTime()
    })
    // Clean history
    this.clapsHistory = takeRight(this.clapsHistory, MAX_HISTORY_LENGTH) // no need to maintain a big history
  }

  listen = () => {
    try {
      const { MAX_HISTORY_LENGTH, AUDIO_SOURCE, DETECTION_PERCENTAGE_START, DETECTION_PERCENTAGE_END } = this.config
      const filename = appRoot + '/input.wav'
      // Listen for sound
      const cmd = 'sox -t ' + AUDIO_SOURCE + ' ' + filename + ' silence 1 0.0001 '  + DETECTION_PERCENTAGE_START + ' 1 0.1 ' + DETECTION_PERCENTAGE_END + ' −−no−show−progress stat'
      const child = exec(cmd)
      let body  = ''
      child.stderr.on("data", buf => {
        console.log("debug data", bug)
        body += buf
      })
      child.on("exit", () => {
        const stats = parseOutput(body)
        console.log("debug stats", stats)
        if(this.isClap(stats)) {
          this.handleClap()
        }
        this.listen() // listen again
      })
    } catch(e) {
      console.log("error listening", e)
    }
  }

  addClapListener = (cb = () => {}, { number = 2, maxDelay = 2000 }) => {
    const listenerId = uniqueid()
    this.cbs = {
      ...this.cbs,
      [listenerId]: {
        {
          id: listenerId,
          cb,
          number,
          maxDelay
        }
      }
    }
    const release = () => {
      this.cbs = omit(this.cbs, [listenerId])
    }
    return release
  }

  // pause
  pause = () => {
    this.paused = true
  }

  // resume
  resume = () => {
    this.paused = false
  }
}


/*


    function _handleMultipleClapsEvent(props) {
        // Retrieve latest claps
        var latestClaps = _.takeRight(clapsHistory, props.num);
        if(latestClaps.length === props.num) {
            // Check that the delay between the last clap and the first is inferior to what was requested by user
            var lastClap = _.last(latestClaps);
            var firstClap = _.first(latestClaps);
            var delay = lastClap.time - firstClap.time;
            if(delay < props.maxDelay) {
                props.fn(delay);
            }
        }
    }

    function _handleMultipleClaps() {
        // If callback registered, handle them
        if(EVENTS.multipleClaps.length > 0) {
            _.forEach(EVENTS.multipleClaps,  function(cbProps) {
                _handleMultipleClapsEvent(cbProps);
            });
        }
    }

*/

export default clapDetector
