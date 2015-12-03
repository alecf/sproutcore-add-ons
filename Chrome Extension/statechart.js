console.log('XXXX STATECHART DEBUGGING ENABLED');

var HEIGHT = 400,
    WIDTH = 900;
var MARGIN = 30;
var SHAPE_HEIGHT = 6;
var SHAPE_WIDTH = SHAPE_HEIGHT * 2;
var SHAPE_RADIUS = SHAPE_HEIGHT/2;

// Sizes the current SVG and tree to the visible window
function resizeContent() {
    svg.attr('width', document.body.clientWidth - 2*MARGIN);
    stateTree.size([parseFloat(svg.attr('width')) - 2*MARGIN,
                    parseFloat(svg.attr('height')) - 2*MARGIN]);
}

var stateTree = d3.layout.tree()
    .size([WIDTH-MARGIN, HEIGHT-MARGIN])
    .children(function(node) {
        return node.substates;
    });


var svg = d3.select('#statechart')
    .append('svg')
    .attr('height', HEIGHT + 2*MARGIN)
    .attr('width', WIDTH + 2*MARGIN);

var chart = svg
    .append('g')
    .attr('transform', 'translate(' + MARGIN + ', ' + MARGIN + ')');

var linkContainer = chart.append('g').classed('links', true);
var nodeContainer = chart.append('g').classed('nodes', true);

function dump(s) {
    document.querySelector('#console').innerHTML = s;
}

function updateStatus(s) {
    document.querySelector('#status').innerHTML = s || '(missing?)';
}


dump('almost ready');
var KEEP_STATUS = true;

function maybeClearStatus() {
    KEEP_STATUS = false;
    setTimeout(function() {
        if (!KEEP_STATUS) {
            updateStatus('');
        }
    }, 5000);
}

function nodeMouseenter(d) {
    updateStatus(d.path);
    KEEP_STATUS = true;
}

// return an nested array of states, as paths, where each nested array has a common prefix
// [
//   "__ROOT_STATE__.showingAppState.socketIOState.readyState",
//   [
//     "__ROOT_STATE__.showingAppState.firstLoadingTierState.showingProjectsState",
//     "__ROOT_STATE__.showingAppState.firstLoadingTierState.showingScenariosState.scenariosAreReadyState.readyState",
//     "__ROOT_STATE__.showingAppState.firstLoadingTierState.showingLayersState.layersAreReadyState.readyState",
//     "__ROOT_STATE__.showingAppState.firstLoadingTierState.showingToolsState",
//     "__ROOT_STATE__.showingAppState.firstLoadingTierState.crudState.noModalState",
//     [
//       "__ROOT_STATE__.showingAppState.firstLoadingTierState.showingMapState.mapState.layersAreReadyForMapState",
//       "__ROOT_STATE__.showingAppState.firstLoadingTierState.showingMapState.layerSelectionEditState.layerSelectionIsReadyState.selectedFeaturesState.featuresAreReadyState.readyState"
//     ],
//     [
//       [
//         "__ROOT_STATE__.showingAppState.firstLoadingTierState.firstTierAwaitingState.secondTierLoadingState.showingDbEntitiesState.dbEntitiesAreReadyState.loadingTemplateFeatureDependenciesState.loadPrimaryGeographyTemplateFeaturesState.templateFeatureIsReadyState",
//         "__ROOT_STATE__.showingAppState.firstLoadingTierState.firstTierAwaitingState.secondTierLoadingState.showingDbEntitiesState.dbEntitiesAreReadyState.loadingTemplateFeatureDependenciesState.loadingTemplateFeatureState.templateFeatureIsReadyState"
//       ],
//       "__ROOT_STATE__.showingAppState.firstLoadingTierState.firstTierAwaitingState.secondTierLoadingState.showingBuiltFormsState.readyState",
//       "__ROOT_STATE__.showingAppState.firstLoadingTierState.firstTierAwaitingState.secondTierLoadingState.showingAnalysisModulesState.analysisModulesAreReadyState.readyState",
//       "__ROOT_STATE__.showingAppState.firstLoadingTierState.firstTierAwaitingState.secondTierLoadingState.showingResultsState.readyState"
//     ]
//   ]
// ]
function getCurrentStates(state) {
    if (state.isCurrentState) {
        return state.path;
    } else if (state.substates && state.substates.length) {
        substates = state.substates.map(getCurrentStates).filter(function(s) {
            return s && s.length;
        });
        //if (!substates.length) return substates;
        if (substates.length == 1) {
            return substates[0];
        }
        return substates;
    } else {
        return null;
    }
}

function isString(s) {
    return typeof s == 'string';
}

function isNotString(s) { return !isString(s); }
// now construct html as a sort of tree
function makeStateTree(states, stripPrefix) {
    var html = '';
    var strings = states ? states.filter(isString) : [];
    var arrays = states.filter(isNotString);
    strings.forEach(function(statePath) {
        var path = statePath;
        if (stripPrefix) {
            path = path.slice(stripPrefix);
        }
        html += '<div class="state-name">' + path + '</div>';
    });

    arrays.forEach(function(substates) {
        var prefix = commonStatePrefix(substates.filter(isString));
        var prefixString = prefix;
        if (stripPrefix) {
            prefixString = prefix.slice(stripPrefix);
        }
        html += '<div class="state-prefix">' + prefixString + '...</div>';
        html += '<div class="state-group">' + makeStateTree(substates, prefix.length) + '</div>';
    });

    return html;
}

// Used to find all common prefixes
function commonStatePrefix(states, sorted) {
    if (!states || !states.length) return '';
    if (!sorted) {
        states = states.slice();
        states.sort();
    }
    var firstState = states[0].split('.');
    var lastState = states[1].split('.');
    for (var i = 0; i < firstState.length; i++) {
        var f = firstState[i];
        var l = lastState[i];
        if (f != l) {
            return firstState.slice(0, i).join('.');
        }
    }
    return states[0];
}

d3.select('#status')
    .on('mouseenter', function() {
        KEEP_STATUS = true;
    })
    .on('mouseout', maybeClearStatus);

function update(source) {
    var nodes = stateTree.nodes(source);
    var links = stateTree.links(nodes);

    var states = getCurrentStates(source);
    if (!isString(states)) {
        d3.select('#current-states').html(makeStateTree(states));
    }
    
    // links first so they're under the shapes
    var link = linkContainer.selectAll('path.link')
        .data(links, function(d) { return d.target.id; });

    var diagonal = d3.svg.diagonal();
    
    link.enter().append('path').classed('link', true);

    link.attr('d', diagonal).classed('active', function(d) {
        return d.target.isEnteredState ||
            d.target.isCurrentState;
    });
    
    link.exit().remove();

    // Nodes next, will contain shapes
    var node = nodeContainer.selectAll('g.node')
        .data(nodes, function(n) { return n.id; });

    var nodeEnter = node.enter().append('g')
        .attr('class', 'node');

    // circles for non-concurrent nodes
    nodeEnter.append('circle').classed('state', true)
        .on('mouseenter', nodeMouseenter)
        .on('mouseout', maybeClearStatus);

    var circleUpdate = node.select('circle.state');

    circleUpdate
        .attr('r', function(d) { if (d.isConcurrentState) { return '0'; } return SHAPE_RADIUS; })
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; })
        .attr('title', function(d) { return d.name; })
        .classed('state-current', function(d) { return d.isCurrentState; })
        .classed('state-entered', function(d) { return d.isEnteredState; })
        .classed('state-concurrent', function(d) { return d.isConcurentState; });

    // removes the entire 'g'
    node.exit().remove();

    // Now rects
    var RECT_WIDTH = SHAPE_WIDTH, RECT_HEIGHT=SHAPE_HEIGHT;
    nodeEnter.append('rect').classed('state', true)
        .on('mouseenter', nodeMouseenter)
        .on('mouseout', maybeClearStatus);
    

    var rectUpdate = node.select('rect.state');
    rectUpdate
        .attr('x', function(d) { return d.x - RECT_WIDTH/2; })
        .attr('y', function(d) { return d.y - RECT_HEIGHT/2; })
        .attr('width', function(d) { if (d.isConcurrentState) { return RECT_WIDTH; } return 0; })
        .attr('height', function(d) { if (d.isConcurrentState) { return RECT_HEIGHT; } return 0; })
        .attr('title', function(d) { return d.name; })
        .classed('state-current', function(d) { return d.isCurrentState; })
        .classed('state-entered', function(d) { return d.isEnteredState; })
        .classed('state-concurrent', function(d) { return d.isConcurentState; });

}

dump('loaded, now inspecting..');

// This runs in the window context
function dumpState(state, parentPath) {
    var result = {
        id: state[SC.guidKey],
        name: state.name,
        path: state.name,
        isCurrentState: state.isCurrentState(),
        isConcurrentState: state.isConcurrentState(),
        isEnteredState: state.isEnteredState(),
        substates: []
    };
    if (parentPath) {
        result.path = parentPath + '.' + result.name;
    }
    var substates = state.get('substates');
    if (substates && substates.length) {
        state.substates.forEach(function(substate) {
            result.substates.push(dumpState(substate, result.path));
        });
    }
    return result;
}

function scheduleNextRefresh() {
    var intervalSelect = document.querySelector('#updateInterval');
    var interval = parseFloat(intervalSelect.value) * 1000;
    if (!isNaN(interval)) {
        // You can set the interval 
        if (interval) {
            window.requestAnimationFrame(function() {
                window.setTimeout(queryAndRefresh, interval);
            });
        }
    } else {
        console.log('failed to parse', intervalSelect.value);
    }
}

function findStateChart() {
    if (window.SC && SC.RootResponder && SC.Statechart) {
        var responder = SC.RootResponder.responder.get('defaultResponder');
        if (responder && responder.kindOf(SC.Statechart)) {
            return responder.rootState;
        }
    }
    return null;
}
var functions = [dumpState, findStateChart];
var LATEST_CHART = null;
function queryAndRefresh() {
    dump('Loading statechart...');
    //console.log('trying to load from ', window);
    chrome.devtools.inspectedWindow.eval(
            makeEvalCall('dumpState(findStateChart())', functions),
        function(result, isException) {
            if (isException || !result) {
                dump('Ooops, error: ' + JSON.stringify(arguments));
            } else {
                dump('statechart loaded.');
                if (result)
                    update(result);
                LATEST_RESULT = result;
            }
            
            scheduleNextRefresh();
        });
}

function init() {
    resizeContent();
    queryAndRefresh();

}


window.requestAnimationFrame(init);

optimizedResize.add(function(e) {
    console.log('Got update: ', e);
    resizeContent();
    update(LATEST_RESULT);
})
