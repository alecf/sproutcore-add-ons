
function makeEvalCall(str, functions) {
    var functionStrings = functions.join(';');
    return '(function(){' + functionStrings + 'return ' + str + '})()';
}
