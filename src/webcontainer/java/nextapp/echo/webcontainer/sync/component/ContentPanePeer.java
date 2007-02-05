/* 
 * This file is part of the Echo Web Application Framework (hereinafter "Echo").
 * Copyright (C) 2002-2007 NextApp, Inc.
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 */

package nextapp.echo.webcontainer.sync.component;

import nextapp.echo.app.ContentPane;
import nextapp.echo.webcontainer.AbstractComponentSynchronizePeer;
import nextapp.echo.webcontainer.OutputContext;
import nextapp.echo.webcontainer.Service;
import nextapp.echo.webcontainer.WebContainerServlet;
import nextapp.echo.webcontainer.service.JavaScriptService;

/**
 * Synchronization peer for <code>ContentPane</code>s.
 */
public class ContentPanePeer extends AbstractComponentSynchronizePeer {

    private static final Service CONTENT_PANE_SERVICE = JavaScriptService.forResource("Echo.ContentPane", 
            "/nextapp/echo/webcontainer/resource/js/Render.ContentPane.js");
    
    static {
        WebContainerServlet.getServiceRegistry().add(CONTENT_PANE_SERVICE);
    }
    
    /**
     * @see nextapp.echo.webcontainer.ComponentSynchronizePeer#getComponentClass()
     */
    public Class getComponentClass() {
        return ContentPane.class;
    }

    /**
     * @see nextapp.echo.webcontainer.ComponentSynchronizePeer#init(nextapp.echo.webcontainer.OutputContext)
     */
    public void init(OutputContext rc) {
        rc.getServerMessage().addLibrary(CONTENT_PANE_SERVICE.getId());
    }
}
