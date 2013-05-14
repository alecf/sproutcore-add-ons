# SproutCore Developer Tools

This repository contains 3rd party tools and extensions for use while developing SproutCore applications.

## Chrome Extension

This extension, available on the Chrome Web Store, adds some useful debugging information for SproutCore applications running in Chrome.  With the extension installed, when you use the elements inspector pane, the view backing any highlighted element will be available on the console as $0v ($0 is the element itself).  As well, the parent of the selected view is available in the console as $0pv.

The extension also adds an extra panel to the elements pane called "SC.View Properties", this panel displays useful information about the currently selected element's SC.View instance, such as the layout, frame, observers, bindings and any other important properties found on the view.
