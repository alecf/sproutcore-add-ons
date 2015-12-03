// borrowed from https://developer.mozilla.org/en-US/docs/Web/Events/resize

// To use:
// optimizedResize.add(function() {
// ...
// })
var optimizedResize = (function() {

    var callbacks = [],
        running = false;

    // fired on resize event
    function resize(e) {

        if (!running) {
            running = true;

            var runAllCallbacks = runCallbacks.bind(this, e);
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(runAllCallbacks);
            } else {
                setTimeout(runAllCallbacks, 66);
            }
        }

    }

    // run the actual callbacks
    function runCallbacks(e) {

        callbacks.forEach(function(callback) {
            callback(e);
        });

        running = false;
    }

    // adds callback to loop
    function addCallback(callback) {

        if (callback) {
            callbacks.push(callback);
        }

    }

    return {
        // public method to add additional callback
        add: function(callback) {
            if (!callbacks.length) {
                window.addEventListener('resize', resize);
            }
            addCallback(callback);
        }
    }
}());

// start process
// optimizedResize.add(function() {
//     console.log('Resource conscious resize callback!')
// });
