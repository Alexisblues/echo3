/**
 * NAMESPACE: Component Rendering Peers.
 * Do not instantiate.
 */
EchoRender = function() { };

EchoRender.peers = new EchoCore.Collections.Map();

EchoRender.registerPeer = function(componentName, peerObject) {
    EchoRender.peers.put(componentName, peerObject);
};

EchoRender.loadPeer = function(component) {
    if (component.peer) {
        return;
// FIXME. which behavior is correct for this scenario: ignore or fail?    
//        throw new Error("Peer already installed: " + component);
    }
    
    var peerClass = EchoRender.peers.get(component.componentType);
    
    if (!peerClass) {
        throw new Error("Peer not found for: " + component.componentType);
    }
    
    component.peer = new peerClass();
    component.peer.component = component;
    
    // Initialize the peer.
    component.peer.init();
};

// FIXME. not invoked...ever.
EchoRender.unloadPeer = function(component) {
    component.peer.component = null;
    component.peer = null;
};

EchoRender.renderComponentAdd = function(update, component, parentElement) {
    EchoRender.loadPeer(component);
    component.peer.disposed = false;
    component.peer.renderAdd(update, parentElement);
};

/**
 * Loads the peer for the specified component and invokes its renderDispose() method.
 * Recursively performs this action on all child components.
 * This method should be invoked by any peer that will be updating a component in such
 * a fashion that it will be destroying the rendering of its children and re-rendering them.
 *
 * @param update the <code>ComponentUpdate</code> for which this change is being performed
 * @param component the <code>Component</code> to be disposed.
 */
EchoRender.renderComponentDispose = function(update, component) {
    EchoRender._renderComponentDisposeImpl(update, component, true);
};

EchoRender._renderComponentDisposeImpl = function(update, component, removeIds) {
    if (!component.peer) {
        return;
    }
    if (component.peer.disposed) {
        return;
    }
    component.peer.disposed = true;
    
EchoCore.Debug.consoleWrite("Dispose:" + component.renderId);    

    component.peer.renderDispose(update);
    for (var i = 0; i < component.children.items.length; ++i) {
        EchoRender._renderComponentDisposeImpl(update, component.children.items[i], false);
    }
    
    if (removeIds) {
        var element = document.getElementById(component.renderId);
        EchoRender._renderRemoveIds(element);
    }
};

EchoRender._renderRemoveIds = function(element) {
    element.id = "";
    for (var i = 0; i < element.childNodes.length; ++i) {
        if (element.childNodes[i].nodeType == 1) {
            EchoRender._renderRemoveIds(element.childNodes[i]);
        }
    }
};

/**
 * Returns the depth of a specified component in the hierarchy.
 * The root component is at depth 0, its immediate children are
 * at depth 1, their children are at depth 2, and so on.
 *
 * @param component the component whose depth is to be calculated
 * @return the depth of the component
 */
EchoRender._getComponentDepth = function(component) {
    var depth = -1;
    while (component != null) {
        component = component.parent;
        ++depth;
    }
    return depth;
};

/**
 * An array sorting implemention to organize an array by component depth.
 */
EchoRender._componentDepthArraySort = function(a, b) {
    return EchoRender._getComponentDepth(a.parent) - EchoRender._getComponentDepth(b.parent);
};

EchoRender._processDispose = function(update) {
    if (update.removedDescendants) {
        for (var i = 0; i < update.removedDescendants.items.length; ++i) {
            EchoRender._renderComponentDisposeImpl(update, update.removedDescendants.items[i], false);
        }
    }
    if (update.removedChildren) {
        for (var i = 0; i < update.removedChildren.items.length; ++i) {
            EchoRender._renderComponentDisposeImpl(update, update.removedChildren.items[i], true);
        }
    }
};

EchoRender.processUpdates = function(updateManager) {
    if (!updateManager.hasUpdates()) {
        return;
    }
    
    var updates = updateManager.getUpdates();
    EchoCore.Debug.consoleWrite(updates.length);
    
    updates.sort(EchoRender._componentDepthArraySort);

    for (var i = 0; i < updates.length; ++i) {
        var peers = updates[i].parent.peer;
        if (peer == null && updates[i].parent.componentType == "Root") {
            EchoRender.loadPeer(updates[i].parent);
        }
    }

    for (var i = updates.length - 1; i >= 0; --i) {
        if (updates[i] == null) {
            // Skip removed updates.
            continue;
        }
        var peer = updates[i].parent.peer;
        EchoRender._processDispose(updates[i]);
    }
    
    // Need to remove descendant peers if renderUpdate returns true.
    for (var i = 0; i < updates.length; ++i) {
        if (updates[i] == null) {
            // Skip removed updates.
            continue;
        }
        var peer = updates[i].parent.peer;
        
        // Set disposed set of peer to false.
        peer.disposed = false;
        
        var fullRender = peer.renderUpdate(updates[i]);
        if (fullRender) {
            // If update required full-rerender of child component hierarchy, remove
            // updates.
            for (var j = i + 1; j < updates.length; ++j) {
                if (updates[j] != null && updates[i].parent.isAncestorOf(updates[j].parent)) {
                    updates[j] = null;
                }
            }
        }
    }
    
    updateManager.purge();
    
    EchoWebCore.VirtualPosition.redraw();
};

EchoRender.ComponentSync = function() { };

EchoRender.ComponentSync.prototype.getContainerElement = function(component) {
    throw new Error("Operation \"getContainerElement\" not supported (Component: " + this.component + ").");
};

EchoRender.ComponentSync.prototype.init = function() {
//    throw new Error("Operation \"renderAdd\" not supported (Component: " + this.component + ").");
};

EchoRender.ComponentSync.prototype.renderAdd = function(update, parentElement) {
    throw new Error("Operation \"renderAdd\" not supported (Component: " + this.component + ").");
};

EchoRender.ComponentSync.prototype.renderDispose = function(update) {
    throw new Error("Operation \"renderDispose\" not supported (Component: " + this.component + ").");
};

/**
 * @return true if this invocation has re-rendered all child components, false otherwise
 */
EchoRender.ComponentSync.prototype.renderUpdate = function(update) {
    throw new Error("Operation \"renderUpdate\" not supported (Component: " + this.component + ").");
};

/**
 * Component rendering peer: Root (not managed by server)
 */
EchoRender.ComponentSync.Root = function() { };

EchoRender.ComponentSync.Root.prototype = new EchoRender.ComponentSync;

EchoRender.ComponentSync.Root.prototype.getContainerElement = function(component) {
    return document.getElementById(this.component.renderId);
};

EchoRender.ComponentSync.Root.prototype.renderDispose = function(update) {
};

EchoRender.ComponentSync.Root.prototype.renderUpdate = function(update) {
    var rootElement = document.getElementById(update.parent.renderId);
    EchoWebCore.DOM.removeAllChildren(rootElement);

    var rootElement = document.getElementById(update.parent.renderId);
    for (var i = 0; i < update.parent.children.items.length; ++i) {
        EchoRender.renderComponentAdd(update, update.parent.children.items[i], rootElement);
    }
    return true;
};

EchoRender.Focus = function() { };

EchoRender.Focus.visitNextFocusComponent = function(containerComponent, previous) {
    var focusedComponent = containerComponent.application.getFocusedComponent();
    if (!focusedComponent) {
        focusedComponent = containerComponent;
    }
    var targetComponent = previous ? EchoRender.Focus._findPreviousFocusComponent(focusedComponent)
            : EchoRender.Focus._findNextFocusComponent(focusedComponent);
    if (targetComponent) {
        targetComponent.peer.focus();
        return true;
    } else {
        return false;
    }
};

EchoRender.Focus._findPreviousFocusComponent = function(component) {
    var originComponent = component;
    var visitedComponents = new Array();
    var lastComponent = null;
    
    while (true) {
        var nextComponent = null;
        if (component == originComponent || (lastComponent && lastComponent.parent == component)) {
            // On origin component (OR) Previously moved up: do not move down.
        } else {
            if (component.getComponentCount() > 0) {
                // Attempt to move down.
                nextComponent = component.getComponent(component.getComponentCount() - 1);

                if (visitedComponents[nextComponent.renderId]) {
                    // Already visited children, cancel the move.
                    nextComponent = null;
                }
            }
        }
        
        if (nextComponent == null) {
            // Attempt to move left.
            nextComponent = EchoRender.Focus._previousSibling(component);
            if (nextComponent && visitedComponents[nextComponent.renderId]) {
                nextComponent = null;
            }
        }

        if (nextComponent == null) {
            // Move up.
            nextComponent = component.parent;
        }
        
        if (nextComponent == null) {
            return null;
        }
        
        lastComponent = component;
        component = nextComponent;
        visitedComponents[component.renderId] = true;

        if (component != originComponent && component.peer.focus) {
            return component;
        }
    }
};

EchoRender.Focus._findNextFocusComponent = function(component) {
    var originComponent = component;
    var visitedComponents = new Array();
    var lastComponent = null;
    
    while (true) {
        var nextComponent = null;
        if (component.getComponentCount() > 0) {
            if (lastComponent && lastComponent.parent == component) {
                // Previously moved up: do not move down.
            } else {
                // Attempt to move down.
                nextComponent = component.getComponent(0);

                if (visitedComponents[nextComponent.renderId]) {
                    // Already visited children, cancel the move.
                    nextComponent = null;
                }
            }
        }
        
        if (nextComponent == null) {
            // Attempt to move right.
            nextComponent = EchoRender.Focus._nextSibling(component);
            if (nextComponent && visitedComponents[nextComponent.renderId]) {
                nextComponent = null;
            }
        }
        if (nextComponent == null) {
            // Move up.
            nextComponent = component.parent;
        }
        
        if (nextComponent == null) {
            return null;
        }
        
        lastComponent = component;
        component = nextComponent;
        visitedComponents[component.renderId] = true;

        if (component != originComponent && component.peer.focus) {
            return component;
        }
    }
};

EchoRender.Focus._nextSibling = function(component) {
    if (!component.parent) {
        // No parent: no siblings.
        return null;
    }
    
    var componentIndex = component.parent.indexOf(component);
    if (componentIndex >= component.parent.getComponentCount() - 1) {
        // On last sibling.
        return null;
    }
    
    return component.parent.getComponent(componentIndex + 1);
};

EchoRender.Focus._previousSibling = function(component) {
    if (!component.parent) {
        // No parent: no siblings.
        return null;
    }
    
    var componentIndex = component.parent.indexOf(component);
    if (componentIndex < 1) {
        // On first sibling.
        return null;
    }
    
    return component.parent.getComponent(componentIndex - 1);
};

EchoRender.Property = function() {
};

EchoRender.Property.Border = function() { };

EchoRender.Property.Border.render = function(border, element) {
    if (border) {
        var color = border.color ? border.color.value : null;
        element.style.border = EchoRender.Property.Extent.toPixels(border.size) + "px " + border.style + " " 
                + (color ? color : "");
    } else {
        element.style.border = "";
    }
};

EchoRender.Property.Color = function() { };

EchoRender.Property.Color.render = function(color, element, styleProperty) { 
    var color = component.getRenderProperty(componentProperty);
    element.style[styleProperty] = color ? color.value : "";
};

EchoRender.Property.Color.renderComponentProperty = function(component, componentProperty, defaultValue, element, styleProperty) { 
    var color = component.getRenderProperty ? component.getRenderProperty(componentProperty)
            : component.getProperty(componentProperty);
    element.style[styleProperty] = color ? color.value : (defaultValue ? defaultValue.value : "");
};

EchoRender.Property.Color.renderFB = function(component, element) { 
    var f = component.getRenderProperty("foreground");
    element.style.color = f ? f.value : "";
    var b = component.getRenderProperty("background");
    element.style.backgroundColor = b ? b.value : "";
};

EchoRender.Property.Extent = function() { };

EchoRender.Property.Extent.toPixels = function(extent, horizontal) {
    if (extent == null) {
        return 0;
    } else {
        return EchoWebCore.Render.extentToPixels(extent.value, extent.units, horizontal);
    }
};

EchoRender.Property.FillImage = function() { };

EchoRender.Property.FillImage.FLAG_ENABLE_IE_PNG_ALPHA_FILTER = 0x1;

EchoRender.Property.FillImage.render = function(fillImage, element, flags) {
    if (!fillImage || !fillImage.image) {
        // No image specified, do nothing.
        return;
    }
    if (EchoWebCore.Environment.PROPRIETARY_IE_PNG_ALPHA_FILTER_REQUIRED &&
            flags && (flags & EchoRender.Property.FillImage.FLAG_ENABLE_IE_PNG_ALPHA_FILTER)) {
        // IE6 PNG workaround required.
        element.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" 
            + fillImage.image.url + "', sizingMethod='scale')";
    } else {
        // IE6 PNG workaround not required.
        element.style.backgroundImage = "url(" + fillImage.image.url + ")";
    }
    
    if (fillImage.repeat) {
        element.style.backgroundRepeat = fillImage.repeat;
    }
    
    if (fillImage.x || fillImage.y) {
        element.style.backgroundPosition = (fillImage.x ? fillImage.x : "0") + " " + (fillImage.y ? fillImage.y : "0");
    }
};

EchoRender.Property.FillImage.renderComponentProperty = function(component, componentProperty, defaultValue,
        element) {
    var fillImage = component.getRenderProperty ? component.getRenderProperty(componentProperty)
            : component.getProperty(componentProperty);
    EchoRender.Property.FillImage.render(fillImage, element);
};

EchoRender.Property.Insets = function() { };

EchoRender.Property.Insets.renderComponentProperty = function(component, componentProperty, defaultValue, 
        element, styleProperty) { 
    var insets = component.getRenderProperty ? component.getRenderProperty(componentProperty)
            : component.getProperty(componentProperty);
    EchoRender.Property.Insets.renderPixel(insets, element, styleProperty);
};

EchoRender.Property.Insets.renderPixel = function(insets, element, styleAttribute) {
    if (insets) {
        var pixelInsets = EchoRender.Property.Insets.toPixels(insets);
        element.style[styleAttribute] = pixelInsets.top + "px " + pixelInsets.right + "px "
                + pixelInsets.bottom + "px " + pixelInsets.left + "px";
    } else {
        element.style[styleAttribute] = "";
    }
};

EchoRender.Property.Insets.toPixels = function(insets) {
    var pixelInsets = new Object();
    pixelInsets.top = EchoWebCore.Render.extentToPixels(insets.top.value, insets.top.units, false);
    pixelInsets.right = EchoWebCore.Render.extentToPixels(insets.right.value, insets.right.units, true);
    pixelInsets.bottom = EchoWebCore.Render.extentToPixels(insets.bottom.value, insets.bottom.units, false);
    pixelInsets.left = EchoWebCore.Render.extentToPixels(insets.left.value, insets.left.units, true);
    return pixelInsets;
};

EchoRender.SyncUtil = function() { };

//FIXME. findContainerElementByIndex...probably needs to die.
EchoRender.SyncUtil.findContainerElementByIndex = function(component) {
    var element = document.getElementById(component.parent.renderId);
    if (!element) {
        throw new Error("Cannot find index of container element for " + component + " because parent component "
                + component.parent + " does not appear to be rendered.");
    }
    var index = component.parent.indexOf(component);

    return element.childNodes[index];
};

/**
 * Convenience method to return the parent DOM element into which a 
 * component should be rendered.
 */
EchoRender.SyncUtil.getContainerElement = function(component) {
    return component.parent.peer.getContainerElement(component);
};

//FXIME? This method is also invoking dispose on the component....this is kind of what we want, but kind of not.
EchoRender.SyncUtil.renderRemove = function(update, component) {
    var element = document.getElementById(component.renderId);
    EchoRender.renderComponentDispose(update, component);
    element.parentNode.removeChild(element);
};

EchoRender.registerPeer("Root", EchoRender.ComponentSync.Root);
