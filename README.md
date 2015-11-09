Clap detection module  for node js

## Synopsis

At the top of the file there should be a short introduction and/ or overview that explains **what** the project is. This description should match descriptions added for package managers (Gemspec, package.json, etc.)
I created this module for my project of personal assistant on Raspberry Pi. The clap detection allows me to activate the assistant whenever I need it (and prevent it from continuously being listening for instructions or interpreting random noises as instructions)

## Installation

This module requires "sox" (http://sox.sourceforge.net/) to be installed
```bash
sudo apt-get install sox
```

## Usage

```bash
/* Require the module */
var clapDetector = require('clap-detector');

/* Define configuration */
var clapConfig = {
   AUDIO_SOURCE: 'hw:1,0',
};

/* Start clap detection */
clapDetector.start(clapConfig);

// Register on clap event
clapDetector.onClap(function() {
    //console.log('your callback code here ');
}.bind(this));

// Register to a serie of claps within given delay
clapDetector.onClaps(3, 2000, function(delay) {
    //console.log('your callback code here ');
}.bind(this));
```

## Tests

These will be coming soon. Please do not hesitate to add some !

## About the Author

I am a full-stack Javascript developer based in Lyon, France.

[Check out my website](http://www.thomschell.com)

## License

clap-detector is dual licensed under the MIT license and GPL.
For more information click [here](https://opensource.org/licenses/MIT).