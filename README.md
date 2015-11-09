Clap detection module  for node js
===

## Synopsis

At the top of the file there should be a short introduction and/ or overview that explains **what** the project is. This description should match descriptions added for package managers (Gemspec, package.json, etc.)
I created this module for my project of personal assistant on Raspberry Pi. The clap detection allows me to activate the assistant whenever I need it (and prevent it from continuously being listening for instructions or interpreting random noises as instructions)

## Requirements
This module works on a linux based OS (raspbian, Ubuntu, Debian...) using alsa for audio and having a working microphone.

## Installation

This module requires sox, "the Swiss Army knife of sound processing programs" (http://sox.sourceforge.net/) to be installed
```bash
sudo apt-get install sox
```
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
=> register a callback that will be triggered whenever a serie of claps (determined by the number of claps) is detected within the period of time you've specified (delay).

```bash
// Require the module
var clapDetector = require('clap-detector');

// Define configuration
var clapConfig = {
   AUDIO_SOURCE: 'hw:1,0'
};

// Start clap detection
clapDetector.start(clapConfig);

// Register on clap event
clapDetector.onClap(function() {
    //console.log('your callback code here ');
}.bind(this));

// Register to a serie of 3 claps occuring within 3 seconds
clapDetector.onClaps(3, 2000, function(delay) {
    //console.log('your callback code here ');
}.bind(this));
```

## Tests

These will be added soon. Please do not hesitate to add some !

## About the Author

I am a full-stack Javascript developer based in Lyon, France.

[Check out my website](http://www.thomschell.com)

## License

clap-detector is dual licensed under the MIT license and GPL.
For more information click [here](https://opensource.org/licenses/MIT).