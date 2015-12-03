
function makeBindingsTree(root) {
    for (var i = 0; i < root._bindings.length; i++) {
        var binding = root[root._bindings[i]];
        var from = binding._fromRoot ? '<%@>:%@'.fmt(binding._fromRoot,binding._fromPropertyPath) : binding._fromPropertyPath;
        var to = binding._toPropertyPath;
        var oneWay = binding._oneWay ? '-' : '>';
    }
}

function loadBindings() {
    // chrome.devtools.inspectedWindow.eval(
    //     makeEvalCall(
}

function init() {

    //loadBindings();
    window.addEventListener('message', function(e) {
        loadBindings();

    }, false);
}


window.requestAnimationFrame(init);
