Clap detection module for node js
===

## Synopsis

ClapDetector is a hand clap detection module for nodejs (iojs). It detects a clap or a series of claps and allows you to trigger callbacks whenever these events happen.
I created this module for my personal assistant project on a Raspberry Pi (raspbian). The clap detection allows me to activate the assistant whenever I need it (and prevents it from continuously listening out for instructions or interpreting random noises as instructions)

## Requirements
This module works on linux based OS (raspbian, Ubuntu, Debian...) using alsa for audio and a working microphone or Mac OS X using coreaudio.

## Installation

This module requires sox, "the Swiss Army knife of sound processing programs" (http://sox.sourceforge.net/) to be installed
### Linux
```bash
sudo apt-get install sox
```
### Mac OS X
```bash
brew install sox
```

### npm install
You can simply add this module to your node.js project with
```bash
npm install --save clap-detector
```

## Usage

First, create an instance of the ClapDetector class:
```bash
const clap = new ClapDetector()
```

Then register a callback that will be triggered whenever a series of hand claps is detected. Your callback will be provided with an array of claps and their associated timestamps as arguments.

```bash
const disposableOneClapListener = clap.addClapsListener(claps => {
  console.log("heard 1 clap (force)", claps)
}, { number: 1, delay: 0, force: true })
```

You can dispose (remove) an clap listener by calling the disposable method returned by addClapsListeners

```bash
disposableOneClapListener() // dispose the clap listener
```

Finally  you can call the dispose() method when you want to stop clap detection and free associated resources

```bash
clap.dispose()
```

## Full example
```bash
import ClapDetector from 'clap-detector'

const clap = new ClapDetector()
const disposableOneClapListener = clap.addClapsListener(claps => {
  console.log("heard 1 clap (force)", claps)
}, { number: 1, delay: 0, force: true })

const disposableOneClapForceListener = clap.addClapsListener(claps => {
  console.log("heard 1 clap", claps)
}, { number: 1, delay: 1000 })

const disposableTwoClapsListener = clap.addClapsListener(claps => {
  console.log("heard 2 claps", claps)
}, { number: 2, delay: 1000 })

const disposableThreeClapsListener = clap.addClapsListener(claps => {
  console.log("heard 3 claps", claps)
}, { number: 3, delay: 1000 })

// Cancel some clap listeners
// Cancel alls claps listener but 2 claps after 10 seconds
setTimeout(() => {
  console.log("only listen to 2 claps now")
  disposableOneClapListener()
  disposableOneClapForceListener()
  disposableThreeClapsListener()
}, 10000)

// Dispose (stop sox process and listeners) after 30s
setTimeout(() => {
  console.log("dispose all listeners and free ressources")
  clap.dispose()
}, 30000)
```

## Configuration

You can pass a configuration object when you create an instance of the ClapDetector class. If you don't the following config will be used.

```bash
// DEFAULT CONFIG
var CONFIG = {
  AUDIO_SOURCE: 'hw:1,0', // this is your microphone input. If you don't know it you can refer to this thread (http://www.voxforge.org/home/docs/faq/faq/linux-how-to-determine-your-audio-cards-or-usb-mics-maximum-sampling-rate)
  DETECTION_PERCENTAGE_START : '5%', // minimum noise percentage threshold necessary to start recording sound
  DETECTION_PERCENTAGE_END: '5%',  // minimum noise percentage threshold necessary to stop recording sound
  CLAP_AMPLITUDE_THRESHOLD: 0.7, // minimum amplitude threshold to be considered as clap
  CLAP_ENERGY_THRESHOLD: 0.3,  // maximum energy threshold to be considered as clap
  MAX_HISTORY_LENGTH: 10 // all claps are stored in history, this is its max length
}
const clap = new ClapDetector(config)
```

If you wish to improve the clap detection you can fiddle with the CLAP_AMPLITUDE_THRESHOLD and CLAP_ENERGY_THRESHOLD values. Depending on your microphone these might need to be modified.

## Tests

These will be added soon. Please do not hesitate to submit some Ò!

## About the Author

I am a full-stack Javascript developer based in Lyon, France.

[Check out my website](http://www.thomschell.com)

## License

clap-detector is dual licensed under the MIT license and GPL.
For more information click [here](https://opensource.org/licenses/MIT).
