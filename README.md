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
// sudo might be required depending on your system
npm install --save clap-detector
```

## Usage

There are thee public methods you can use:
- clapDetector.start(clapConfig);
=> this needs to be called to initialize clap detection. The clapConfig object is not mandatory but you can use it to overwrite the default configuration (see next section)
- clapDetector.onClap(yourcallbackfunctionhere)
=> register a callback that will be triggered whenever a clap of hand is detected
- clapDetector.onClaps(numberOfClaps, delay, yourcallbackfunctionhere)
=> register a callback that will be triggered whenever a series of claps (determined by the number of claps) is detected within the period of time you've specified (delay).

```bash
// Require the module
var clapDetector = require('clap-detector');

// Define configuration
var clapConfig = {
   AUDIO_SOURCE: 'alsa hw:1,0'// default for linux
};

// Start clap detection
clapDetector.start(clapConfig);

// Register on clap event
clapDetector.onClap(function(history) {
    //console.log('your callback code here ', history);
});

// Register to a serie of 3 claps occuring within 2 seconds
clapDetector.onClaps(3, 2000, function(delay) {
    //console.log('your callback code here ');
});

// Update the configuration
clapDetector.updateConfig(clapConfig);
```

## Configuration

You can pass a configuration object at the initialisation time (clapDetector.init(yourConfObject)). If you don't the following config will be used. You should at least provide the audio input (if different from the default config).

```bash
// DEFAULT CONFIG
var CONFIG = {
        AUDIO_SOURCE: 'hw:1,0', // this is your microphone input. If you don't know it you can refer to this thread (http://www.voxforge.org/home/docs/faq/faq/linux-how-to-determine-your-audio-cards-or-usb-mics-maximum-sampling-rate)
        DETECTION_PERCENTAGE_START : '5%', // minimum noise percentage threshold necessary to start recording sound
        DETECTION_PERCENTAGE_END: '5%',  // minimum noise percentage threshold necessary to stop recording sound
        CLAP_AMPLITUDE_THRESHOLD: 0.7, // minimum amplitude threshold to be considered as clap
        CLAP_ENERGY_THRESHOLD: 0.3,  // maximum energy threshold to be considered as clap
        MAX_HISTORY_LENGTH: 10 // all claps are stored in history, this is its max length
    };
```

If you wish to improve the clap detection you can fiddle with the CLAP_AMPLITUDE_THRESHOLD and CLAP_ENERGY_THRESHOLD values. Depending on your microphone these might need to be modified.

## Tests

These will be added soon. Please do not hesitate to add some !

## About the Author

I am a full-stack Javascript developer based in Lyon, France.

[Check out my website](http://www.thomschell.com)

## License

clap-detector is dual licensed under the MIT license and GPL.
For more information click [here](https://opensource.org/licenses/MIT).
