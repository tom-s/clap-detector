var _ = require('lodash');
var Q = require('q');
var exec = require('child_process').exec;

var clapDetector = (function() {
    /* DEFAULT CONFIG */
    var CONFIG = {
        AUDIO_SOURCE: 'hw:1,0',
        DETECTION_PERCENTAGE_START : '5%',
        DETECTION_PERCENTAGE_END: '5%',
        CLEANING: {
            PERFORM: false, // requires a noise profile
            NOISE_PROFILE: 'noise.prof'
        },
        SOUND_FILE : "input.wav", // input file
        SOUND_FILE_CLEAN  : "input-clean.wav",
        CLAP_AMPLITUDE_THRESHOLD: 0.7,
        CLAP_ENERGY_THRESHOLD: 0.3,
        MAX_HISTORY_LENGTH: 10 // no need to maintain big history
    };

    var paused = false;

    /* Callback for events */
    var EVENTS = {
        clap: {
            fn: null,
        },
        multipleClaps: []
    };

    /* History of claps */
    var clapsHistory = [];

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

    /* Check if multiple claps have been done */
    function _handleMultipleClaps() {
        // Clean history
        clapsHistory = _.takeRight(clapsHistory, CONFIG.MAX_HISTORY_LENGTH); // no need to maintain a big history

        // If callback registered, handle them
        if(EVENTS.multipleClaps.length > 0) {
            _.forEach(EVENTS.multipleClaps,  function(cbProps) {
                _handleMultipleClapsEvent(cbProps);
            });
        }
    }

    /* Listen */
    function _listen() {
        console.log("------ Listen for noise --------");
        // Listen for sound
        var cmd = 'sox -t alsa ' + CONFIG.AUDIO_SOURCE + ' ' + CONFIG.SOUND_FILE + ' silence 1 0.0001 '  + CONFIG.DETECTION_PERCENTAGE_START + ' 1 0.1 ' + CONFIG.DETECTION_PERCENTAGE_END;
        var child = exec(cmd);
        child.on('close', function() {
            if(paused) {
                return;
            }

            _listen(); // listen again

            // Clean and check file and take action
            _cleanFile().then(function() {
                _isClap().then(function() {
                    clapsHistory.push({
                        time: new Date().getTime()
                    });
                    if(EVENTS.clap.fn) {
                        EVENTS.clap.fn();
                    }
                    _handleMultipleClaps();
                });
            });

        });
    }

    function _isClap() {

        var deferred = Q.defer();

         // Check that file is a clap
         var cmd = "sox " + CONFIG.SOUND_FILE_CLEAN + " -n stat 2>&1"; //| sed -n 's#^Length (seconds):[^0-9]*\\([0-9.]*\\)$#\\1#p'
         var regExDuration = /Length[\s]+\(seconds\):[\s]+([0-9.]+)/;
         var regExRms = /RMS[\s]+amplitude:[\s]+([0-9.]+)/;
         var regExMax = /Maximum[\s]+amplitude:[\s]+([0-9.]+)/;
         exec(cmd, function(error, out, stderr) {
             // Is this a clap of hand ?
             console.log('debug', error, out, stderr);
             var durationData = out.match(regExDuration);
             var duration = parseFloat(durationData[1]);
             var rmsData = out.match(regExRms);
             var rms = parseFloat(rmsData[1]);
             var maxData = out.match(regExMax);
             var max = parseFloat(maxData[1]);

             // Does it have the characteristics of a clap
             if(duration < 1 && max > CONFIG.CLAP_AMPLITUDE_THRESHOLD && rms < CONFIG.CLAP_ENERGY_THRESHOLD){
                deferred.resolve(res);
             } else {
                deferred.resolve(false);
             }
         });

        return deferred.promise;
    }

    function  _cleanFile() {
        var deferred = Q.defer();
        if(CONFIG.PERFORM) {
            // Clean noise
            var cmd = 'sox ' + CONFIG.SOUND_FILE + ' ' + CONFIG.SOUND_FILE_CLEAN + ' noisered ' + CONFIG.NOISE_PROFILE + ' 0.21';
            exec(cmd, function() {
                deferred.resolve();
            });
        } else {
            // No cleaning to do
            deferred.resolve();
        }

        return deferred.promise;
    }

    return {
        start: function (props) {
            _.assign(CONFIG, props);
            _listen();
        },

        //1 clap
        onClap: function (cb) {
            if(cb) {
                EVENTS.clap.fn = cb;
            }
        },

        // multiples claps
        onClaps: function (num, maxDelay, cb) {
            if(num && maxDelay && cb) {
                EVENTS.multipleClaps.push({
                    num: num,
                    maxDelay: maxDelay,
                    fn: cb
                });
            }

        }
    };
})();

module.exports = clapDetector;