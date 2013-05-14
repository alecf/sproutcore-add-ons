// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// The function below is executed in the context of the inspected page.
var view_getProperties = function () {
  var view = window.SC && $0 ? SC.View.views[$0.id] : null,
    data = {};

  if (!view && window.SC && $0) {
    var node = $0,
      parentNode;

    while (parentNode = node.parentNode) {
      // Keep trying.
      view = SC.View.views[parentNode.id];
      if (view) { break; }
      node = parentNode;
    }
  }

  if (view) {
    var localObservers = [],
      bindings = [],
      displayDidChange = view.displayDidChange;

    // Assign variables for easy access.
    window.$0v = view;
    window.$0pv = view.get('parentView');

    // Default information for all views.
    data = {
      classNames: view.get('classNames'),
      layerId: view.get('layerId'),
      '  Class': SC._object_className(view.constructor),
      layout: SC.stringFromLayout(view.get('layout')),
      frame: SC.stringFromRect(view.get('frame')),
      isEnabled: view.get('isEnabled')
      // theme: view.get('theme').name
    };

    // If the view wants accelerated layer, indicate if it got it.
    if (view.get('wantsAcceleratedLayer')) {
      data.hasAcceleratedLayer = view.get('hasAcceleratedLayer');
    }

    // If there are no display properties, don't show it
    if (view.get('displayProperties').length) {
      data.displayProperties = view.get('displayProperties');
    }

    // Pull out observers.
    for (var key in view) {
      var observedProp = key.match(/_kvo_local_(.*)/),
        anonFunction;

      if (observedProp) {
        observedProp = observedProp[1];
        localObservers.push(observedProp + " >> this." + view['_kvo_local_' + observedProp][0]);
      } else {
        observedProp = key.match(/_kvo_observers_(.*)/);
        if (observedProp) {
          observedProp = observedProp[1];

          anonFunction = view['_kvo_observers_' + observedProp].members[0][1];

          if (anonFunction === view.displayDidChange) {
            localObservers.push(observedProp + " >> this.displayDidChange (displayProperties)");
          } else if (anonFunction === view._isVisibleDidChange) {
            localObservers.push(observedProp + " >> this._isVisibleDidChange (SC.CoreView)");
          } else if (anonFunction === view._isFirstResponderDidChange) {
            localObservers.push(observedProp + " >> this._isFirstResponderDidChange (SC.CoreView)");
          } else {
            localObservers.push(observedProp + " >> " + anonFunction);
          }
        }
      }
    }

    if (localObservers.length) {
      localObservers = localObservers.sort();
      data[' Observers'] = localObservers;
    }

    // Pull out bindings.
    for (var i = 0, len = view._bindings.length; i < len; i++) {
      var binding = view[view._bindings[i]],
        from = binding._fromRoot ? "<%@>:%@".fmt(binding._fromRoot,binding._fromPropertyPath) : binding._fromPropertyPath,
        to = binding._toPropertyPath,
        oneWay = binding._oneWay ? '-' : '>';

      bindings.push("%@ <-%@ %@ (SC.Binding#%@)".fmt(to, oneWay, from, SC.guidFor(binding)));
    }

    if (bindings.length) {
      data[' Bindings'] = bindings;
    }

    // Show the currentState if on 1.10+
    if (view.get('currentState')) {
      var stateName;

      switch (view.get('currentState')) {
      case SC.CoreView.ATTACHED_SHOWING:
        stateName = "ATTACHED_SHOWING";
        break;
      case SC.CoreView.ATTACHED_HIDING:
        stateName = "ATTACHED_HIDING";
        break;
      case SC.CoreView.ATTACHED_HIDDEN:
        stateName = "ATTACHED_HIDDEN";
        break;
      case SC.CoreView.ATTACHED_HIDDEN_BY_PARENT:
        stateName = "ATTACHED_HIDDEN_BY_PARENT";
        break;
      case SC.CoreView.ATTACHED_BUILDING_IN:
        stateName = "ATTACHED_BUILDING_IN";
        break;
      case SC.CoreView.ATTACHED_BUILDING_OUT:
        stateName = "ATTACHED_BUILDING_OUT";
        break;
      case SC.CoreView.ATTACHED_BUILDING_OUT_BY_PARENT:
        stateName = "ATTACHED_BUILDING_OUT_BY_PARENT";
        break;
      case SC.CoreView.ATTACHED_SHOWN:
        stateName = "ATTACHED_SHOWN";
        break;
      default:
        stateName = "";
      }

      data.currentState = stateName;
    }

    // Show action/target if supported.
    if (view.get('action')) {
      data.action = view.get('action');
      data.target = view.get('target');
    }

    if (view.get('title')) {
      data.title = view.get('title');
      data.displayTitle = view.get('displayTitle');
    }

    if (view.get('length')) {
      data.length = view.get('length');
    }

    if (view.get('icon')) {
      data.icon = view.get('icon');
    }

    if (view.get('tooltip')) {
      data.tooltip = view.get('tooltip');
    }

    if (view.get('value')) {
      data.value = view.get('value');
    }
  } else {
    // Clean up.
    delete window.$0v;
    delete window.$0pv;
  }

  return data;
};


// Create the sidebar
chrome.devtools.panels.elements.createSidebarPane( "SC.View Properties",
  function(sidebar) {
    function updateElementProperties() {
      sidebar.setExpression("(" + view_getProperties.toString() + ")()");
    }

    updateElementProperties();

    chrome.devtools.panels.elements.onSelectionChanged.addListener(updateElementProperties);
  }
);
