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
import compact from 'lodash/compact'
import size from 'lodash/size'
import first from 'lodash/first'
import last from 'lodash/last'
import omit from 'lodash/omit'
import maxBy from 'lodash/maxBy'
import orderBy from 'lodash/orderBy'
import uniqueId from 'lodash/uniqueId'
import takeRight from 'lodash/takeRight'
import { exec } from 'child_process'
import appRoot from 'app-root-path'
import os from 'os'

const CONFIG = {
  AUDIO_SOURCE: os.type() === "Darwin" // microphone
  ? 'coreaudio default'
  : (os.type() === "Windows_NT"
    ? 'waveaudio default'
    : 'alsa hw:1,0'),
  DETECTION_PERCENTAGE_START : '10%',
  DETECTION_PERCENTAGE_END: '10%',
  CLAP_AMPLITUDE_THRESHOLD: 0.7,
  CLAP_ENERGY_THRESHOLD: 0.3,
  CLAP_MAX_DURATION: 1500,
  MAX_HISTORY_LENGTH: 100 // no need to maintain big history
}

const parseOutput = body => {
  body = body.replace(new RegExp("[ \\t]+", "g") , " ") //sox use spaces to align output
  const split = new RegExp("^(.*):\\s*(.*)$", "mg")
  let match = ''
  let dict = {} //simple key:value
  while((match = split.exec(body)) !== null) {
    dict[match[1]] = parseFloat(match[2])
  }
  return dict
}

class ClapDetector {
  constructor(props) {
    this.config = {
      ...CONFIG,
      ...props
    }
    this.clapsHistory = []
    this.cbs = {}
    this.timeout = null
    this.child = null
    // Start listening
    this.listen()
  }

  isClap(stats) {
    const { CLAP_MAX_DURATION, CLAP_AMPLITUDE_THRESHOLD, CLAP_ENERGY_THRESHOLD } = this.config
    const duration = get(stats, 'Length (seconds)')
    const rms = get(stats, 'RMS amplitude')
    const max = get(stats, 'Maximum amplitude')
    return (duration < CLAP_MAX_DURATION && max > CLAP_AMPLITUDE_THRESHOLD && rms < CLAP_ENERGY_THRESHOLD)
  }

  handleClap() {
    const { MAX_HISTORY_LENGTH } = this.config
    // Add clap to history
    this.clapsHistory.push({
      id : size(this.clapsHistory),
      time: new Date().getTime()
    })
    // Trigger callbacks
    const waitDelay = get(maxBy(Object.values(this.cbs), cb => cb.delay), 'delay', 0)
    this.timeout && clearTimeout(this.timeout)
    this.timeout = setTimeout(() => this.triggerCallback(), waitDelay + 100)
    this.triggerCallback(true)
    // No need to maintain a big history
    this.clapsHistory = takeRight(this.clapsHistory, MAX_HISTORY_LENGTH)
  }

  triggerCallback(force = false) {
    const forceCallbacks = orderBy(Object.values(this.cbs), 'number', 'desc')
      .filter(cb => cb.force === force)
    const triggerCallbacks = forceCallbacks.reduce((memo, cb) => {
      const claps = takeRight(this.clapsHistory, cb.number)
      // Check that the delay between the last clap and the first is inferior to what was requested by user
      const lastClap = last(claps)
      const firstClap = first(claps)
      const delay = lastClap.time - firstClap.time
      const clapsDetected = size(claps) === cb.number && delay <= cb.delay
      clapsDetected && memo.push({
        fn: cb.fn,
        claps
      })
      return memo
    }, [])
    const filteredTriggerCallbacks = force
      ? triggerCallbacks
      : [first(triggerCallbacks)]
    compact(filteredTriggerCallbacks).forEach(({ fn, claps }) => fn(claps))
  }

  listen() {
    try {
      const { AUDIO_SOURCE, DETECTION_PERCENTAGE_START, DETECTION_PERCENTAGE_END } = this.config
      const filename = appRoot + '/input.wav'
      // Listen for sound
      const cmd = 'sox -t ' + AUDIO_SOURCE + ' ' + filename + ' silence 1 0.0001 '  + DETECTION_PERCENTAGE_START + ' 1 0.1 ' + DETECTION_PERCENTAGE_END + ' −−no−show−progress stat'
      let body  = ''

      this.child = exec(cmd, (err) => {
        if (err) {
          throw err
        }
      })

      this.child.stderr.on("data", buf => {
        body += buf
      })

      this.child.on("exit", () => {
        const stats = parseOutput(body)
        this.isClap(stats) && this.handleClap()
        this.listen() // listen again
      })
    } catch(e) {
      console.error("error running sox", e)
    }
  }

  addClapsListener(fn = () => {}, options = {}) {
    const { number = 1, delay = 1000, force = false } = options
    const listenerId = uniqueId()
    this.cbs = {
      ...this.cbs,
      [listenerId]: {
        id: listenerId,
        fn,
        number,
        delay,
        force
      }
    }
    const dispose = () => {
      this.cbs = omit(this.cbs, [listenerId])
    }
    return dispose
  }

  dispose() {
    this.child && this.child.kill(0)
    this.timeout && clearTimeout(this.timeout)
    this.clapsHistory = []
    this.cbs = {}
    this.timeout = null
    this.child = null
  }
}

export default ClapDetector
