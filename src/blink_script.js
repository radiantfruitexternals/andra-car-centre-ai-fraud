var M = () => {
    // Initialize the global error store if it doesn't exist
    window.__AUTO_ENGINEER_ERRORS__ = window.__AUTO_ENGINEER_ERRORS__ || [];
    
    // Initialize user interaction trail
    window.__AUTO_ENGINEER_INTERACTION_TRAIL__ = window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [];
    
    // Configuration for interaction tracking
    const INTERACTION_TRAIL_CONFIG = {
        MAX_TRAIL_LENGTH: 8, // Keep last 8 interactions
        DEBOUNCE_TIME: 100, // Prevent rapid duplicate events
        TRACK_ELEMENT_TYPES: ['button', 'a', 'input', 'select', 'textarea', '[role="button"]', '[onclick]', '[data-testid]']
    };
    
    // Helper function to add interaction to trail
    const addInteractionToTrail = (interaction) => {
        const trail = window.__AUTO_ENGINEER_INTERACTION_TRAIL__;
        
        // Add timestamp and page context
        const enrichedInteraction = {
            ...interaction,
            timestamp: Date.now(),
            pageUrl: window.location.href,
            pagePath: window.location.pathname + window.location.search + window.location.hash
        };
        
        // Add to trail
        trail.push(enrichedInteraction);
        
        // Keep only the most recent interactions
        if (trail.length > INTERACTION_TRAIL_CONFIG.MAX_TRAIL_LENGTH) {
            trail.shift(); // Remove oldest interaction
        }
    };
    
    // View detection cache to avoid expensive DOM queries
    let viewDetectionCache = { value: null, timestamp: 0 };
    const VIEW_CACHE_DURATION = 100; // 100ms cache
    
    // Helper function to detect current SPA view/page
    const detectCurrentView = () => {
        // Return cached value if still fresh
        const now = Date.now();
        if (viewDetectionCache.value && (now - viewDetectionCache.timestamp) < VIEW_CACHE_DURATION) {
            return viewDetectionCache.value;
        }
        
        let detectedView = null;
        
        // Strategy 1: Check document title (filter out generic/loading titles)
        const title = document.title?.trim();
        if (title && !isGenericTitle(title)) {
            detectedView = title;
        }
        
        // Strategy 2: Look for main heading (h1) - visible ones only
        if (!detectedView) {
            const h1 = document.querySelector('h1:not([style*="display: none"]):not([hidden])');
            if (h1 && h1.textContent?.trim() && isElementVisible(h1)) {
                detectedView = h1.textContent.trim();
            }
        }
        
        // Strategy 3: Check active navigation (comprehensive selectors)
        if (!detectedView) {
            const activeNavSelectors = [
                '[aria-current="page"]',
                '.active:not(.disabled)',
                '.current',
                '[data-current="true"]',
                '.router-link-active',
                '.router-link-exact-active'
            ];
            
            for (const selector of activeNavSelectors) {
                const activeNav = document.querySelector(selector);
                if (activeNav && activeNav.textContent?.trim()) {
                    detectedView = activeNav.textContent.trim();
                    break;
                }
            }
        }
        
        // Strategy 4: Look for explicit page/view markers
        if (!detectedView) {
            detectedView = findExplicitPageMarkers();
        }
        
        // Strategy 5: Analyze main content container
        if (!detectedView) {
            detectedView = analyzeMainContent();
        }
        
        // Strategy 6: URL pathname fallback (meaningful paths only)
        if (!detectedView) {
            const pathname = window.location.pathname;
            if (pathname && pathname !== '/' && pathname !== '/index.html') {
                const segments = pathname.split('/').filter(Boolean);
                if (segments.length > 0) {
                    detectedView = segments[segments.length - 1].replace(/-/g, ' ');
                }
            }
        }
        
        // Final fallback
        const result = detectedView || 'Unknown View';
        
        // Cache the result
        viewDetectionCache = { value: result, timestamp: now };
        return result;
    };
    
    // Helper: Check if title is generic/loading
    const isGenericTitle = (title) => {
        const genericTitles = ['loading', 'my app', 'localhost'];
        const lowerTitle = title.toLowerCase();
        return genericTitles.some(generic => lowerTitle.includes(generic)) || 
               title === document.location.hostname ||
               lowerTitle === 'app'; // Only exact match for 'app'
    };
    
    // Helper: Check if element is visible
    const isElementVisible = (element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    };
    
    // Helper: Find explicit page markers
    const findExplicitPageMarkers = () => {
        const explicitMarkers = [
            { selector: '[data-page]', attr: 'data-page' },
            { selector: '[data-view]', attr: 'data-view' },
            { selector: '[data-route]', attr: 'data-route' },
            { selector: '[data-testid*="page"]', attr: 'data-testid' }
        ];
        
        for (const marker of explicitMarkers) {
            const element = document.querySelector(marker.selector);
            if (element) {
                const value = element.getAttribute(marker.attr);
                if (value && value.length > 0) {
                    return value.replace(/[-_]/g, ' ');
                }
            }
        }
        
        // Check class-based patterns
        const classPatterns = [
            /(?:page|view|screen)-([a-zA-Z]+)/i,
            /([a-zA-Z]+)(?:Page|View|Screen)$/i
        ];
        
        for (const pattern of classPatterns) {
            const elements = document.querySelectorAll('[class*="page-"], [class*="view-"], [class*="Page"], [class*="View"], [class*="Screen"]');
            for (const element of elements) {
                const match = element.className.match(pattern);
                if (match && match[1]) {
                    return match[1].replace(/[-_]/g, ' ');
                }
            }
        }
        
        return null;
    };
    
    // Configurable semantic keywords for view detection
    const SEMANTIC_KEYWORDS = [
        'dashboard', 'profile', 'settings', 'admin', 'login', 'signup', 
        'home', 'about', 'contact', 'help', 'account', 'billing',
        'reports', 'analytics', 'users', 'projects', 'tasks', 'invoice',
        'orders', 'products', 'customers', 'payments', 'notifications'
    ];

    // Helper: Analyze main content container
    const analyzeMainContent = () => {
        const mainContainers = document.querySelectorAll('main, [role="main"], .main-content, #main, .app-content');
        
        for (const main of mainContainers) {
            // Look for semantic indicators in descendant classes
            for (const keyword of SEMANTIC_KEYWORDS) {
                const indicator = main.querySelector(`[class*="${keyword}"]`);
                if (indicator) {
                    return keyword.charAt(0).toUpperCase() + keyword.slice(1);
                }
            }
        }
        
        return null;
    };

    // Helper function to get element identifier (text, aria-label, data attributes, etc.)
    const getElementIdentifier = (element) => {
        // Try different ways to identify the element meaningfully
        const text = element.textContent?.trim() || '';
        const ariaLabel = element.getAttribute('aria-label') || '';
        const dataTestId = element.getAttribute('data-testid') || '';
        const title = element.getAttribute('title') || '';
        const placeholder = element.getAttribute('placeholder') || '';
        const value = element.value || '';
        const id = element.id || '';
        const className = element.className || '';
        
        // Prioritize meaningful identifiers
        if (text && text.length < 50) return `"${text}"`;
        if (ariaLabel) return `[aria-label="${ariaLabel}"]`;
        if (dataTestId) return `[data-testid="${dataTestId}"]`;
        if (title) return `[title="${title}"]`;
        if (placeholder) return `[placeholder="${placeholder}"]`;
        if (value && value.length < 20) return `[value="${value}"]`;
        if (id) return `#${id}`;
        
        // Fallback to tag and class
        const tagName = element.tagName.toLowerCase();
        const shortClassName = className.split(' ').slice(0, 2).join(' ');
        return shortClassName ? `${tagName}.${shortClassName}` : tagName;
    };
    
    // Helper function to check if element is trackable
    const isTrackableElement = (element) => {
        if (!element || !element.tagName) return false;
        
        const tagName = element.tagName.toLowerCase();
        
        // Check basic trackable types
        if (INTERACTION_TRAIL_CONFIG.TRACK_ELEMENT_TYPES.includes(tagName)) {
            return true;
        }
        
        // Check for button role
        if (element.getAttribute('role') === 'button') {
            return true;
        }
        
        // Check for click handlers
        if (element.hasAttribute('onclick') || element.onclick) {
            return true;
        }
        
        // Check for test identifiers
        if (element.hasAttribute('data-testid')) {
            return true;
        }
        
        // Check for additional interactive patterns
        try {
            return element.matches('[tabindex]:not([tabindex="-1"])');
        } catch (e) {
            return false;
        }
    };
    
    // Add a special route handler for the debug endpoint
    if (window.location.pathname === '/__debug/errors') {
        document.body.innerHTML = '';
        document.write(JSON.stringify(window.__AUTO_ENGINEER_ERRORS__ || []));
        document.close();
        return; // Early return to avoid initializing other components
    }

    // Listen for hard refresh messages from parent
    window.addEventListener('message', async (event) => {
        // Verify origin for security
        if (!event.origin.includes('blink.new') && !event.origin.includes('localhost:3000')) {
            return;
        }
        
        if (event.data?.type === 'HARD_REFRESH') {
            try {
                // Clear all caches
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                }
                
                // Unregister service workers
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                }
                
                // Clear sessionStorage and localStorage (be careful with this)
                try {
                    sessionStorage.clear();
                    // Don't clear localStorage as it might contain important app data
                } catch (e) {
                    // Silent fail if storage is not accessible
                }
                
                // Force reload with cache busting
                const url = new URL(window.location.href);
                url.searchParams.set('hard', String(event.data.token || Date.now()));
                window.location.replace(url.toString());
            } catch (error) {
                // Fallback to regular reload if cache clearing fails
                window.location.reload(true);
            }
        }
    });
    
    // Function to check for and process Vite error overlays
    function checkForViteErrorOverlay() {
        const errorOverlay = document.querySelector('vite-error-overlay');
        if (!errorOverlay) return;
        
        // If shadow root isn't ready, queue a check for next frame
        if (!errorOverlay.shadowRoot) {
            requestAnimationFrame(checkForViteErrorOverlay);
            return;
        }
        
        try {
            const shadowRoot = errorOverlay.shadowRoot;
            
            // Extract available information using multiple approaches
            
            // Method 1: Try specific selectors first
            const plugin = shadowRoot.querySelector('span.plugin')?.textContent?.trim() || '';
            const messageBody = shadowRoot.querySelector('.message-body')?.textContent?.trim() || '';
            const fileText = shadowRoot.querySelector('.file')?.textContent?.trim() || '';
            const frame = shadowRoot.querySelector('.frame')?.textContent?.trim() || '';
            const stack = shadowRoot.querySelector('.stack')?.textContent?.trim() || '';
            
            // Method 2: Get text from common containers if specific selectors failed
            const messageElem = !messageBody ? shadowRoot.querySelector('.message') : null;
            const messageText = !messageBody && messageElem ? messageElem.textContent?.trim() || '' : '';
            
            // Method 3: As a last resort, get all text from the window element
            const windowElem = shadowRoot.querySelector('.window');
            const windowText = windowElem ? windowElem.textContent?.trim() || '' : '';
            
            // Use whatever error text we've found (in order of preference)
            const errorText = messageBody || messageText || windowText || 'Unknown Vite error';
            
            // Try to extract location information from any available source
            let locationInfo = null;
            
            // Try various patterns to find filename and line/column numbers
            const locationPatterns = [
                // From file element
                fileText.match(/(.*?):(\d+):(\d+)/),
                // From frame text
                frame.match(/(\S+\.[tj]sx?):(\d+):(\d+)/),
                // From general message text
                errorText.match(/([^:\s]+\.[tj]sx?):(\d+):(\d+)/),
                // From window text as a last resort
                windowText.match(/([^:\s]+\.[tj]sx?):(\d+):(\d+)/)
            ];
            
            // Use the first valid location pattern we find
            for (const match of locationPatterns) {
                if (match) {
                    locationInfo = {
                        filename: match[1],
                        line: parseInt(match[2], 10),
                        column: parseInt(match[3], 10)
                    };
                    break;
                }
            }
            
            // Build the most comprehensive error message possible
            let fullErrorMessage = '';
            
            // Add plugin info if available
            if (plugin) fullErrorMessage += `[${plugin}] `;
            
            // Add the main error message
            fullErrorMessage += errorText;
            
            // Add frame info if it exists and isn't already in the message
            if (frame && !fullErrorMessage.includes(frame)) {
                fullErrorMessage += `\n\n${frame}`;
            }
            
            // Add file info if it exists and isn't already in the message
            if (fileText && !fullErrorMessage.includes(fileText)) {
                fullErrorMessage += `\n\nFile: ${fileText}`;
            }
            
            // If we somehow still have no message, use whatever text we can find
            if (!fullErrorMessage.trim()) {
                fullErrorMessage = windowText || 'Vite error detected (no details available)';
            }
            
            // Always send the error if a vite-error-overlay exists
            const errorId = `hmr-error-${Date.now()}`;
            
            // Create the error object
            const errorObj = {
                id: errorId,
                message: fullErrorMessage,
                stack: stack || '',
                source: 'hmr',
                location: locationInfo,
                timestamp: Date.now(),
                pageUrl: window.location.href,
                pagePath: window.location.pathname + window.location.search + window.location.hash,
                interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
            };
            
            // Store in global error array
            window.__AUTO_ENGINEER_ERRORS__.push(errorObj);
            
            // Send to parent via postMessage
            window.top && window.top.postMessage({
                type: "RUNTIME_ERROR",
                error: errorObj
            }, "*");
        } catch (err) {
            // Last resort: try to get any text content from the overlay
            try {
                const anyText = errorOverlay.shadowRoot?.textContent?.trim() || 'Unknown Vite error';
                const errorObj = {
                    id: `hmr-error-fallback-${Date.now()}`,
                    message: `Vite error: ${anyText.substring(0, 500)}`,
                    source: 'hmr',
                    timestamp: Date.now(),
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname + window.location.search + window.location.hash,
                    interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
                };
                
                // Store in global error array
                window.__AUTO_ENGINEER_ERRORS__.push(errorObj);
                
                // Send to parent via postMessage
                window.top && window.top.postMessage({
                    type: "RUNTIME_ERROR",
                    error: errorObj
                }, "*");
            } catch (finalErr) {
                // Silent fail - no logging in production
            }
        }
    }

    // Set up Vite HMR error detection
    function setupViteErrorDetection() {
        // 1. Watch for DOM changes that might add the error overlay
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    // Check if vite-error-overlay was added
                    const hasErrorOverlay = Array.from(mutation.addedNodes).some(
                        node => node.nodeName?.toLowerCase() === 'vite-error-overlay'
                    );
                    if (hasErrorOverlay) {
                        requestAnimationFrame(checkForViteErrorOverlay);
                    }
                }
            }
        });

        // Start observing immediately
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 2. Listen for Vite HMR events
        if (import.meta?.hot) {
            import.meta.hot.on('vite:error', () => {
                requestAnimationFrame(checkForViteErrorOverlay);
            });
        }

        // 3. Check for existing error overlay
        if (document.querySelector('vite-error-overlay')) {
            requestAnimationFrame(checkForViteErrorOverlay);
        }
    }

    // Immediately detect full-page navigation and notify parent.
    // Must run at script-execution time (NOT waiting for 'load') so the parent's
    // currentPathRef is updated before any handleRefresh timeout fires (~1s after
    // agent finishes). PreviewPanel always appends ?v= and ?t= to its programmatic
    // reloads, so those are excluded. A same-origin referrer confirms the user
    // navigated here via a link click within the deployed app.
    try {
        var _cu = new URL(document.location.href);
        var _hasInternalParams = _cu.searchParams.has('v') && _cu.searchParams.has('t');
        var _isSameOriginNav = !!document.referrer && new URL(document.referrer).origin === window.location.origin;
        if (_isSameOriginNav && !_hasInternalParams) {
            f({ type: "URL_CHANGED", url: document.location.href });
        }
    } catch (_err) {}
    // Track initial URL so the dedup guard in _notifyUrl doesn't re-fire for the same URL
    var _initialUrl = document.location.href;

    // Set up SPA navigation detection by patching the history API.
    // Fires immediately at pushState/replaceState time — more reliable than
    // MutationObserver (which is indirect, delayed, and requires DOM mutations).
    // This is the same pattern used by PostHog, GA4, Segment, and Next.js DevTools.
    // Runs on 'load' so the app's router has already initialized; our wrapper
    // calls the original first, then notifies the parent.
    // IMPORTANT: Only notify when URL actually changed -- routers (React Router,
    // Next.js) call replaceState frequently for internal state without changing
    // the URL. Firing URL_CHANGED on every call floods the parent with messages.
    let _lastNotifiedUrl = _initialUrl || document.location.href;
    const _notifyUrl = () => {
        const currentUrl = document.location.href;
        if (currentUrl !== _lastNotifiedUrl) {
            _lastNotifiedUrl = currentUrl;
            f({ type: "URL_CHANGED", url: currentUrl });
        }
    };
    let t = () => {
        const _push = history.pushState;
        const _replace = history.replaceState;
        history.pushState = function(...args) { _push.apply(history, args); _notifyUrl(); };
        history.replaceState = function(...args) { _replace.apply(history, args); _notifyUrl(); };
        window.addEventListener('popstate', _notifyUrl);
        window.addEventListener('hashchange', _notifyUrl);
    };

    // Start error detection immediately
    setupViteErrorDetection();
    
    // Set up URL change detection after load
    window.addEventListener("load", t);
    
    // Set up user interaction tracking
    setupUserInteractionTracking();
    
    // Function to set up comprehensive user interaction tracking
    function setupUserInteractionTracking() {
        // Clean up any existing observers from previous script loads
        if (window.__AUTO_ENGINEER_CLEANUP__) {
            window.__AUTO_ENGINEER_CLEANUP__();
        }
        
        let lastInteractionTime = 0;
        
        // Track page load as initial interaction
        const initialView = detectCurrentView();
        addInteractionToTrail({
            type: 'page_load',
            element: 'page',
            identifier: initialView,
            details: {
                title: document.title,
                url: window.location.href,
                detectedView: initialView
            }
        });
        
        // Track clicks on interactive elements
        document.addEventListener('click', (event) => {
            const now = Date.now();
            
            // Debounce rapid clicks
            if (now - lastInteractionTime < INTERACTION_TRAIL_CONFIG.DEBOUNCE_TIME) {
                return;
            }
            lastInteractionTime = now;
            
            const element = event.target;
            if (!isTrackableElement(element)) return;
            
            const identifier = getElementIdentifier(element);
            const tagName = element.tagName.toLowerCase();
            
            // Get additional context
            const rect = element.getBoundingClientRect();
            const details = {
                tagName,
                type: element.type || '',
                href: element.href || '',
                position: {
                    x: Math.round(rect.left + rect.width / 2),
                    y: Math.round(rect.top + rect.height / 2)
                }
            };
            
            addInteractionToTrail({
                type: 'click',
                element: tagName,
                identifier,
                details
            });
        }, true); // Use capture phase to catch all clicks
        
        // Track form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName.toLowerCase() !== 'form') return;
            
            const identifier = getElementIdentifier(form);
            const details = {
                action: form.action || '',
                method: form.method || 'GET',
                fieldCount: form.elements.length
            };
            
            addInteractionToTrail({
                type: 'form_submit',
                element: 'form',
                identifier,
                details
            });
        }, true);
        
        // Track input focus for important form fields
        document.addEventListener('focus', (event) => {
            const element = event.target;
            const tagName = element.tagName.toLowerCase();
            
            if (!['input', 'textarea', 'select'].includes(tagName)) return;
            
            const identifier = getElementIdentifier(element);
            const details = {
                tagName,
                type: element.type || '',
                name: element.name || '',
                required: element.required || false
            };
            
            addInteractionToTrail({
                type: 'focus',
                element: tagName,
                identifier,
                details
            });
        }, true);
        
        // Track navigation changes in SPAs (for React Router, Vue Router, etc.)
        let currentPath = window.location.pathname + window.location.search + window.location.hash;
        
        // Use MutationObserver to detect DOM changes that might indicate navigation
        let currentView = detectCurrentView();
        let navigationTimeout = null;
        
        const handleNavigation = () => {
            const newPath = window.location.pathname + window.location.search + window.location.hash;
            const newView = detectCurrentView();
            
            // Detect navigation by either URL change OR view change
            if (newPath !== currentPath || newView !== currentView) {
                const prevPath = currentPath;
                const prevView = currentView;
                currentPath = newPath;
                currentView = newView;
                
                addInteractionToTrail({
                    type: 'navigation',
                    element: 'page',
                    identifier: newView,
                    details: {
                        from: prevPath,
                        to: newPath,
                        fromView: prevView,
                        toView: newView,
                        title: document.title
                    }
                });
            }
        };
        
        const navigationObserver = new MutationObserver(() => {
            // Debounce navigation detection to avoid excessive calls
            if (navigationTimeout) {
                clearTimeout(navigationTimeout);
            }
            navigationTimeout = setTimeout(handleNavigation, 50);
        });
        
        // Observe changes to the main content area
        const rootElement = document.getElementById('root') || document.body;
        navigationObserver.observe(rootElement, {
            childList: true,
            subtree: true,
            attributes: false
        });
        
        // Cleanup function to prevent memory leaks
        const cleanup = () => {
            if (navigationObserver) {
                navigationObserver.disconnect();
            }
            if (navigationTimeout) {
                clearTimeout(navigationTimeout);
                navigationTimeout = null;
            }
        };
        
        // Clean up on page unload or when script is reinitialized
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('pagehide', cleanup);
        
        // Store cleanup function globally for potential manual cleanup
        window.__AUTO_ENGINEER_CLEANUP__ = cleanup;
        
        // Also listen for popstate events (back/forward button)
        window.addEventListener('popstate', () => {
            // Clear any pending navigation timeout since popstate is immediate
            if (navigationTimeout) {
                clearTimeout(navigationTimeout);
                navigationTimeout = null;
            }
            
            // Use a small delay to allow DOM to update after popstate
            setTimeout(() => {
                const newPath = window.location.pathname + window.location.search + window.location.hash;
                const newView = detectCurrentView();
                if (newPath !== currentPath || newView !== currentView) {
                    const prevPath = currentPath;
                    const prevView = currentView;
                    currentPath = newPath;
                    currentView = newView;
                    
                    addInteractionToTrail({
                        type: 'navigation',
                        element: 'page',
                        identifier: newView,
                        details: {
                            trigger: 'popstate',
                            from: prevPath,
                            to: newPath,
                            fromView: prevView,
                            toView: newView,
                            title: document.title
                        }
                    });
                }
            }, 10);
        });
    }
};
var c = {
    HIGHLIGHT_COLOR: "#0da2e7",
    HIGHLIGHT_BG: "#0da2e71a",
    ALLOWED_ORIGINS: ["https://blink.new", "http://localhost:3000"],
    DEBOUNCE_DELAY: 10,
    Z_INDEX: 1e4,
    TOOLTIP_OFFSET: 25,
    MAX_TOOLTIP_WIDTH: 200,
    SCROLL_DEBOUNCE: 420,
    FULL_WIDTH_TOOLTIP_OFFSET: "12px",
    HIGHLIGHT_STYLE: {
        FULL_WIDTH: {
            OFFSET: "-5px",
            STYLE: "solid"
        },
        NORMAL: {
            OFFSET: "0",
            STYLE: "solid"
        }
    },
    SELECTED_ATTR: "data-blnk-selected",
    HOVERED_ATTR: "data-blnk-hovered",
    OVERRIDE_STYLESHEET_ID: "blnk-override"
}
  , f = t => {
    c.ALLOWED_ORIGINS.forEach(e => {
        try {
            if (!window.parent)
                return;
            if (!t || typeof t != "object") {
                console.error("Invalid message format");
                return
            }
            window.parent.postMessage(t, e)
        } catch (r) {
            console.error(`Failed to send message to ${e}:`, r)
        }
    }
    )
}
  , Y = () => new Promise(t => {
    if (document.readyState !== "loading") {
        t();
        return
    }
    requestIdleCallback( () => {
        t()
    }
    )
}
)
  , P = async () => {
    await Y();
    let t = import.meta.hot;
    return t && await new Promise(e => {
        let r = () => {
            if (!t.data.pending) {
                e();
                return
            }
            setTimeout(r, 50)
        }
        ;
        r()
    }
    ),
    window.__REACT_SUSPENSE_DONE && await window.__REACT_SUSPENSE_DONE,
    !0
}
  , C = () => new Promise(t => {
    let e = document.getElementById("root");
    if (e && e.children.length > 0) {
        t();
        return
    }
    new MutationObserver( (s, o) => {
        let d = document.getElementById("root");
        d && d.children.length > 0 && (o.disconnect(),
        t())
    }
    ).observe(document.body, {
        childList: !0,
        subtree: !0
    })
}
);
var z = () => {
    let t = window.fetch;
    window.fetch = async function(...e) {
        let r = Date.now();
        try {
            let s;
            if (e?.[1]?.body)
                try {
                    typeof e[1].body == "string" ? s = e[1].body : e[1].body instanceof FormData ? s = "FormData: " + Array.from(e[1].body.entries()).map( ([d,a]) => `${d}=${a}`).join("&") : e[1].body instanceof URLSearchParams ? s = e[1].body.toString() : s = JSON.stringify(e[1].body)
                } catch {
                    s = "Could not serialize request body"
                }
            let o = await t(...e);
            return f({
                type: "NETWORK_REQUEST",
                request: {
                    url: e?.[0] || o.url,
                    method: e?.[1]?.method || "GET",
                    status: o.status,
                    statusText: o.statusText,
                    responseBody: o?.clone?.() ? await o.clone().text() : void 0,
                    requestBody: s,
                    timestamp: new Date().toISOString(),
                    duration: Date.now() - r,
                    origin: window.location.origin,
                    headers: e?.[1]?.headers ? Object.fromEntries(new Headers(e?.[1]?.headers)) : {},
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname + window.location.search + window.location.hash,
                    interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
                }
            }),
            o
        } catch (s) {
            let o;
            if (e?.[1]?.body)
                try {
                    typeof e[1].body == "string" ? o = e[1].body : e[1].body instanceof FormData ? o = "FormData: " + Array.from(e[1].body.entries()).map( ([T,i]) => `${T}=${i}`).join("&") : e[1].body instanceof URLSearchParams ? o = e[1].body.toString() : o = JSON.stringify(e[1].body)
                } catch {
                    o = "Could not serialize request body"
                }
            let d = {
                url: e?.[0],
                method: e?.[1]?.method || "GET",
                origin: window.location.origin,
                timestamp: new Date().toISOString(),
                duration: Date.now() - r,
                headers: e?.[1]?.headers ? Object.fromEntries(new Headers(e?.[1]?.headers)) : {},
                requestBody: o
            }
              , a = s instanceof TypeError ? {
                ...d,
                error: {
                    message: s?.message || "Unknown error",
                    stack: s?.stack
                }
            } : {
                ...d,
                error: {
                    message: s && typeof s == "object" && "message"in s && typeof s.message == "string" ? s.message : "Unknown fetch error",
                    stack: s && typeof s == "object" && "stack"in s && typeof s.stack == "string" ? s.stack : "Not available"
                }
            };
            throw f({
                type: "NETWORK_REQUEST",
                request: {
                    ...a,
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname + window.location.search + window.location.hash,
                    interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
                }
            }),
            s
        }
    }
}
  , H = ( () => {
    let t = !1
      , e = ({message: r, lineno: s, colno: o, filename: d, error: a}) => ({
        message: r,
        lineno: s,
        colno: o,
        filename: d,
        stack: a?.stack
    });
    return () => {
        if (t)
            return;
        let r = new Set
          , s = a => {
            let {lineno: T, colno: i, filename: E, message: b} = a;
            return `${b}|${E}|${T}|${i}`
        }
        ;
        z();
        let o = a => r.has(a) ? !0 : (r.add(a),
        setTimeout( () => r.delete(a), 5e3),
        !1)
          , d = a => {
            let T = s(a);
            if (o(T))
                return;
            let i = e(a);
            
            // Add to global error store
            window.__AUTO_ENGINEER_ERRORS__ = window.__AUTO_ENGINEER_ERRORS__ || [];
            window.__AUTO_ENGINEER_ERRORS__.push({
                id: `runtime-error-${Date.now()}`,
                message: i.message,
                location: {
                    filename: i.filename,
                    line: i.lineno,
                    column: i.colno
                },
                stack: i.stack,
                source: 'runtime',
                timestamp: Date.now(),
                pageUrl: window.location.href,
                pagePath: window.location.pathname + window.location.search + window.location.hash,
                interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
            });
            
            // Send via postMessage
            f({
                type: "RUNTIME_ERROR",
                error: {
                    ...i,
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname + window.location.search + window.location.hash,
                    interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
                }
            })
        }
        ;
        window.addEventListener("error", d),
        window.addEventListener("unhandledrejection", a => {
            // Don't filter out errors without stack - many legitimate errors don't have stack traces
            let T = a.reason?.stack || a.reason?.message || String(a.reason);
            if (o(T))
                return;
            let i = {
                message: a.reason?.message || String(a.reason) || "Unhandled promise rejection",
                stack: a.reason?.stack || String(a.reason)
            };
            
            // Add to global error store
            window.__AUTO_ENGINEER_ERRORS__ = window.__AUTO_ENGINEER_ERRORS__ || [];
            window.__AUTO_ENGINEER_ERRORS__.push({
                id: `promise-error-${Date.now()}`,
                message: i.message,
                stack: i.stack,
                source: 'promise',
                timestamp: Date.now(),
                pageUrl: window.location.href,
                pagePath: window.location.pathname + window.location.search + window.location.hash,
                interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
            });
            
            // Send via postMessage
            f({
                type: "UNHANDLED_PROMISE_REJECTION",
                error: {
                    ...i,
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname + window.location.search + window.location.hash,
                    interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
                }
            })
        }
        ),
        t = !0
    }
}
)();
var v = class {
    constructor(e) {
        this.message = `[Circular Reference to ${e}]`
    }
}
  , y = class {
    constructor(e, r) {
        this._type = e,
        this.value = r
    }
}
  , X = {
    maxDepth: 10,
    indent: 2,
    includeSymbols: !0,
    preserveTypes: !0,
    maxStringLength: 1e4,
    maxArrayLength: 100,
    maxObjectKeys: 100
};
function A(t, e={}, r=new WeakMap, s="root") {
    let o = {
        ...X,
        ...e
    };
    if (s.split(".").length > o.maxDepth)
        return new y("MaxDepthReached",`[Max depth of ${o.maxDepth} reached]`);
    if (t === void 0)
        return new y("undefined","undefined");
    if (t === null)
        return null;
    if (typeof t == "string")
        return t.length > o.maxStringLength ? new y("String",`${t.slice(0, o.maxStringLength)}... [${t.length - o.maxStringLength} more characters]`) : t;
    if (typeof t == "number")
        return Number.isNaN(t) ? new y("Number","NaN") : Number.isFinite(t) ? t : new y("Number",t > 0 ? "Infinity" : "-Infinity");
    if (typeof t == "boolean")
        return t;
    if (typeof t == "bigint")
        return new y("BigInt",t.toString());
    if (typeof t == "symbol")
        return new y("Symbol",t.toString());
    if (typeof t == "function")
        return new y("Function",{
            name: t.name || "anonymous",
            stringValue: t.toString().slice(0, o.maxStringLength)
        });
    if (t && typeof t == "object") {
        if (r.has(t))
            return new v(r.get(t));
        r.set(t, s)
    }
    if (t instanceof Error) {
        let i = {
            name: t.name,
            message: t.message,
            stack: t.stack
        };
        for (let E of Object.getOwnPropertyNames(t))
            i[E] || (i[E] = A(t[E], o, r, `${s}.${E}`));
        return new y("Error",i)
    }
    if (t instanceof Date)
        return new y("Date",{
            iso: t.toISOString(),
            value: t.valueOf(),
            local: t.toString()
        });
    if (t instanceof RegExp)
        return new y("RegExp",{
            source: t.source,
            flags: t.flags,
            string: t.toString()
        });
    if (t instanceof Promise)
        return new y("Promise","[Promise]");
    if (t instanceof WeakMap || t instanceof WeakSet)
        return new y(t.constructor.name,"[" + t.constructor.name + "]");
    if (t instanceof Set) {
        let i = Array.from(t);
        return i.length > o.maxArrayLength ? new y("Set",{
            values: i.slice(0, o.maxArrayLength).map( (E, b) => A(E, o, r, `${s}.Set[${b}]`)),
            truncated: i.length - o.maxArrayLength
        }) : new y("Set",{
            values: i.map( (E, b) => A(E, o, r, `${s}.Set[${b}]`))
        })
    }
    if (t instanceof Map) {
        let i = {}
          , E = 0
          , b = 0;
        for (let[_,R] of t.entries()) {
            if (b >= o.maxObjectKeys) {
                E++;
                continue
            }
            let S = typeof _ == "object" ? JSON.stringify(A(_, o, r, `${s}.MapKey`)) : String(_);
            i[S] = A(R, o, r, `${s}.Map[${S}]`),
            b++
        }
        return new y("Map",{
            entries: i,
            truncated: E || void 0
        })
    }
    if (ArrayBuffer.isView(t)) {
        let i = t;
        return new y(t.constructor.name,{
            length: i.length,
            byteLength: i.byteLength,
            sample: Array.from(i.slice(0, 10))
        })
    }
    if (Array.isArray(t))
        return t.length > o.maxArrayLength ? t.slice(0, o.maxArrayLength).map( (i, E) => A(i, o, r, `${s}[${E}]`)).concat([`... ${t.length - o.maxArrayLength} more items`]) : t.map( (i, E) => A(i, o, r, `${s}[${E}]`));
    let d = {}
      , a = [...Object.getOwnPropertyNames(t)];
    o.includeSymbols && a.push(...Object.getOwnPropertySymbols(t).map(i => i.toString()));
    let T = 0;
    return a.slice(0, o.maxObjectKeys).forEach(i => {
        try {
            let E = t[i];
            d[i] = A(E, o, r, `${s}.${i}`)
        } catch (E) {
            d[i] = new y("Error",`[Unable to serialize: ${E.message}]`)
        }
    }
    ),
    a.length > o.maxObjectKeys && (T = a.length - o.maxObjectKeys,
    d["..."] = `${T} more properties`),
    d
}
var Q = {
    log: console.log,
    warn: console.warn,
    error: console.error
}
  , J = {
    log: "info",
    warn: "warning",
    error: "error"
}
  , k = ( () => {
    let t = !1;
    return () => {
        if (t)
            return;
        let e = r => {
            console[r] = (...s) => {
                Q[r].apply(console, s);
                let o = null;
                if (r === "warn" || r === "error") {
                    let a = new Error;
                    a.stack && (o = a.stack.split(`
`).slice(2).join(`
`))
                }
                let d = s.map(a => A(a, {
                    maxDepth: 5,
                    includeSymbols: !0,
                    preserveTypes: !0
                }));
                
                // Add console errors to global store
                if (r === "error") {
                    window.__AUTO_ENGINEER_ERRORS__ = window.__AUTO_ENGINEER_ERRORS__ || [];
                    window.__AUTO_ENGINEER_ERRORS__.push({
                        id: `console-error-${Date.now()}`,
                        message: d.map(a => typeof a == "string" ? a : JSON.stringify(a, null, 2)).join(" ") + (o ? `
` + o : ""),
                        stack: o,
                        source: 'console',
                        timestamp: Date.now(),
                        pageUrl: window.location.href,
                        pagePath: window.location.pathname + window.location.search + window.location.hash,
                        interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
                    });
                }
                
                // Send via postMessage
                f({
                    type: "CONSOLE_OUTPUT",
                    level: J[r],
                    message: d.map(a => typeof a == "string" ? a : JSON.stringify(a, null, 2)).join(" ") + (o ? `
` + o : ""),
                    logged_at: new Date().toISOString(),
                    raw: d,
                    pageUrl: window.location.href,
                    pagePath: window.location.pathname + window.location.search + window.location.hash,
                    interactionTrail: [...(window.__AUTO_ENGINEER_INTERACTION_TRAIL__ || [])]
                })
            }
        }
        ;
        e("log"),
        e("warn"),
        e("error"),
        t = !0
    }
}
)();
var Z = t => {
    let e = r => {
        let o = {
            type: "node",
            children: [],
            attrs: [...r.attributes].reduce( (d, a) => (d[a.name] = a.value,
            d), {}),
            tagName: r.tagName,
            data: D(r)
        };
        return [...r.childNodes].forEach(d => {
            d instanceof HTMLElement ? o.children.push(e(d)) : d instanceof Text && o.children.push({
                type: "text",
                textContent: d.textContent || ""
            })
        }
        ),
        o
    }
    ;
    return e(t)
}
  , $ = async () => {
    await P();
    let t = Z(document.querySelector("#root"));
    f({
        type: "COMPONENT_TREE",
        payload: {
            tree: t
        }
    })
}
;
var F = () => {
    let t = new Set;
    window.addEventListener("keydown", e => {
        let r = [];
        e.metaKey && r.push("Meta"),
        e.ctrlKey && r.push("Ctrl"),
        e.altKey && r.push("Alt"),
        e.shiftKey && r.push("Shift");
        let s = e.key !== "Meta" && e.key !== "Control" && e.key !== "Alt" && e.key !== "Shift" ? e.key : ""
          , o = [...r, s].filter(Boolean).join("+");
        ["Meta+z", "Meta+Backspace", "Meta+d"].includes(o) && e.preventDefault(),
        o && f({
            type: "KEYBIND",
            payload: {
                compositeKey: o,
                rawEvent: {
                    key: e.key,
                    code: e.code,
                    metaKey: e.metaKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    shiftKey: e.shiftKey
                },
                timestamp: Date.now()
            }
        })
    }
    , {
        passive: !0
    })
}
;
window.BLNK_SELECTOR_SCRIPT_VERSION = "1.0.0";
var N = t => t.hasAttribute("data-blnk-id") || t.hasAttribute("data-component-path")
  , U = t => {
    if (!t)
        return {};
    let[e,r,s] = t.split(":");
    return {
        filePath: e,
        lineNumber: parseInt(r || "0", 10),
        col: parseInt(s || "0", 10)
    }
}
  , L = t => {
    let e = t.getAttribute("data-blnk-id") || "";
    if (e) {
        let {filePath: o, lineNumber: d, col: a} = U(e);
        return {
            filePath: o || "",
            lineNumber: d || 0,
            col: a || 0
        }
    }
    let r = t.getAttribute("data-component-path") || ""
      , s = t.getAttribute("data-component-line") || "";
    return {
        filePath: r || "",
        lineNumber: parseInt(s, 10) || 0,
        col: 0
    }
}
  , D = t => {
    let e = t.getAttribute("data-blnk-id") || ""
      , {filePath: r, lineNumber: s, col: o} = U(e)
      , d = t.tagName.toLowerCase()
      , a = t.getAttribute("data-component-content") || null
      , T = Array.from(t.children).filter(i => N(i) && L(i).filePath !== r).filter( (i, E, b) => E === b.findIndex(_ => L(_).filePath === L(i).filePath)).map(i => ({
        id: i.getAttribute("data-blnk-id") || "",
        filePath: L(i).filePath,
        fileName: L(i).filePath?.split?.("/").pop() || "",
        lineNumber: L(i).lineNumber,
        col: L(i).col,
        elementType: i.tagName.toLowerCase(),
        content: i.getAttribute("data-component-content") || "",
        className: i.getAttribute("class") || "",
        textContent: i.innerText,
        attrs: {
            src: i.getAttribute("src") || ""
        }
    }));
    return {
        id: t.getAttribute("data-blnk-id") || "",
        filePath: L(t).filePath,
        fileName: L(t).filePath?.split?.("/").pop() || "",
        lineNumber: L(t).lineNumber,
        col: L(t).col,
        elementType: d,
        content: a || "",
        children: T,
        className: t.getAttribute("class") || "",
        textContent: t.innerText,
        attrs: {
            src: t.getAttribute("src") || ""
        }
    }
}
  , G = () => {
    class t {
        constructor() {
            this.hoveredElement = null,
            this.isActive = !1,
            this.tooltip = null,
            this.scrollTimeout = null,
            this.mouseX = 0,
            this.mouseY = 0,
            this.styleElement = null
        }
        reset() {
            this.hoveredElement = null,
            this.scrollTimeout = null
        }
    }
    let e = new t
      , r = (n, u) => {
        let g = null;
        return (...l) => {
            g && clearTimeout(g),
            g = setTimeout( () => n(...l), u)
        }
    }
    ;
    F();
    let s = () => {
        e.tooltip = document.createElement("div"),
        e.tooltip.className = "gpt-selector-tooltip",
        e.tooltip.setAttribute("role", "tooltip"),
        document.body.appendChild(e.tooltip);
        let n = document.createElement("style");
        n.textContent = `
        .gpt-selector-tooltip {
          position: fixed;
          z-index: ${c.Z_INDEX};
          pointer-events: none;
          background-color: ${c.HIGHLIGHT_COLOR};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          line-height: 1;
          white-space: nowrap;
          display: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: opacity 0.2s ease-in-out;
          margin: 0;
        }
        [${c.HOVERED_ATTR}] {
          position: relative;
        }
        [${c.HOVERED_ATTR}]::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0px;
          outline: 1px dashed ${c.HIGHLIGHT_COLOR} !important;
          outline-offset: ${c.HIGHLIGHT_STYLE.NORMAL.OFFSET} !important;
          background-color: ${c.HIGHLIGHT_BG} !important;
          z-index: ${c.Z_INDEX};
          pointer-events: none;
        }

        [${c.SELECTED_ATTR}] {
          position: relative;
        }
        [${c.SELECTED_ATTR}]::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0px;
          outline: 1px dashed ${c.HIGHLIGHT_COLOR} !important;
          outline-offset: 3px !important;
          transition: outline-offset 0.2s ease-in-out;
          z-index: ${c.Z_INDEX};
          pointer-events: none;
        }

        [${c.SELECTED_ATTR}][contenteditable] {
          outline: none !important;
        }

        [${c.HOVERED_ATTR}][data-full-width]::before,
        [${c.SELECTED_ATTR}][data-full-width]::before {
          outline-offset: ${c.HIGHLIGHT_STYLE.FULL_WIDTH.OFFSET} !important;
        }
      `,
        document.head.appendChild(n)
    }
      , o = n => {
        if (!(!e.tooltip || !n))
            try {
                let u = n.getBoundingClientRect()
                  , g = n.tagName.toLowerCase()
                  , l = Math.abs(u.width - window.innerWidth) < 5;
                if (e.tooltip.style.maxWidth = `${c.MAX_TOOLTIP_WIDTH}px`,
                l)
                    e.tooltip.style.left = c.FULL_WIDTH_TOOLTIP_OFFSET,
                    e.tooltip.style.top = c.FULL_WIDTH_TOOLTIP_OFFSET;
                else {
                    let p = Math.max(0, u.top - c.TOOLTIP_OFFSET);
                    e.tooltip.style.left = `${Math.max(0, u.left)}px`,
                    e.tooltip.style.top = `${p}px`
                }
                e.tooltip.textContent = g
            } catch (u) {
                console.error("Error updating tooltip:", u),
                b()
            }
    }
      , d = n => {
        let u = Math.abs(n.getBoundingClientRect().width - window.innerWidth) < 5;
        n.setAttribute(c.HOVERED_ATTR, "true"),
        u && n.setAttribute("data-full-width", "true")
    }
      , a = n => {
        n.removeAttribute(c.HOVERED_ATTR),
        n.removeAttribute("data-full-width"),
        n.style.cursor = ""
    }
      , T = n => {
        let u = n.tagName.toLowerCase() === "svg"
          , g = n.closest("svg") !== null;
        return !u && g
    }
      , i = r(n => {
        if (!e.isActive || !N(n.target) || n.target.tagName.toLowerCase() === "html" || T(n.target))
            return;
        e.hoveredElement && w(L(e.hoveredElement)).forEach(l => {
            l.classList.contains("gpt-selected-element") || a(l)
        }
        ),
        e.hoveredElement = n.target,
        (e.hoveredElement && w(L(e.hoveredElement)))?.forEach(g => {
            g.classList.contains("gpt-selected-element") || d(g)
        }
        ),
        o(e.hoveredElement),
        e.tooltip && (e.tooltip.style.display = "block",
        e.tooltip.style.opacity = "1")
    }
    , c.DEBOUNCE_DELAY)
      , E = r( () => {
        e.isActive && (e.hoveredElement && ((e.hoveredElement && w(L(e.hoveredElement)))?.forEach(u => {
            u.removeAttribute(c.HOVERED_ATTR),
            u.hasAttribute(c.SELECTED_ATTR) || a(u)
        }
        ),
        e.hoveredElement = null),
        b())
    }
    , c.DEBOUNCE_DELAY)
      , b = () => {
        e.tooltip && (e.tooltip.style.opacity = "0",
        e.tooltip.style.display = "none")
    }
      , _ = () => {
        e.scrollTimeout && clearTimeout(e.scrollTimeout),
        b(),
        e.hoveredElement && !e.hoveredElement.classList.contains("gpt-selected-element") && a(e.hoveredElement),
        e.scrollTimeout = setTimeout( () => {
            e.scrollTimeout = null;
            let n = document.elementFromPoint(e.mouseX, e.mouseY);
            n && e.isActive && i({
                target: n
            })
        }
        , c.SCROLL_DEBOUNCE)
    }
      , R = n => {
        e.isActive && n.target && n.target instanceof HTMLElement && ["input", "textarea", "select"].includes(n.target.tagName.toLowerCase()) && n.preventDefault()
    }
      , S = n => {
        if (e.isActive)
            return n.preventDefault(),
            n.stopPropagation(),
            !1
    }
      , K = () => {
        document.addEventListener("mouseover", i),
        document.addEventListener("mouseout", E),
        document.addEventListener("click", x, !0),
        document.addEventListener("dblclick", q, !0),
        window.addEventListener("scroll", _, {
            passive: !0
        }),
        document.addEventListener("mousedown", R, !0);
        let n = document.createElement("style");
        n.textContent = `
        * {
          scroll-behavior: auto !important;
        }
      `,
        document.head.appendChild(n),
        e.styleElement = n,
        document.addEventListener("click", S, !0),
        document.addEventListener("submit", S, !0),
        document.addEventListener("touchstart", S, !0),
        document.addEventListener("touchend", S, !0)
    }
      , I = () => {
        document.removeEventListener("mouseover", i),
        document.removeEventListener("mouseout", E),
        document.removeEventListener("click", x),
        window.removeEventListener("scroll", _),
        document.removeEventListener("mousedown", R, !0),
        document.removeEventListener("click", S, !0),
        document.removeEventListener("submit", S, !0),
        document.removeEventListener("touchstart", S, !0),
        document.removeEventListener("touchend", S, !0),
        e.styleElement && (e.styleElement.remove(),
        e.styleElement = null),
        document.body.style.cursor = "",
        document.body.style.userSelect = "",
        document.body.style.msUserSelect = "",
        document.body.style.mozUserSelect = "",
        e.hoveredElement && (e.hoveredElement.hasAttribute(c.SELECTED_ATTR) || a(e.hoveredElement),
        e.hoveredElement = null),
        b()
    }
      , j = n => {
        if (n.key === "Escape" && e.isActive) {
            n.preventDefault(),
            n.stopPropagation(),
            f({
                type: "TOGGLE_PICK_AND_EDIT_REQUESTED",
                payload: !1
            });
            return
        }
        (n.altKey && n.key.toLowerCase() === "s" || n.key === "\xDF") && (n.preventDefault(),
        n.stopPropagation(),
        f({
            type: "TOGGLE_PICK_AND_EDIT_REQUESTED",
            payload: null
        }))
    }
      , te = (n, u) => document.elementFromPoint(n, u)
      , w = n => {
        let u = `[data-blnk-id="${n.filePath}:${n.lineNumber}:${n.col || "0"}"]`
          , g = document.querySelectorAll(u);
        if (g.length > 0)
            return g;
        let l = `[data-component-path="${n.filePath}"][data-component-line="${n.lineNumber}"]`;
        return document.querySelectorAll(l)
    }
      , B = n => {
        try {
            if (!n?.origin || !n?.data?.type || !c.ALLOWED_ORIGINS.includes(n.origin))
                return;
            switch (n.data.type) {
            case "TOGGLE_SELECTOR":
                let u = !!n.data.payload;
                e.isActive !== u && (e.isActive = u,
                e.isActive ? (K(),
                C().then( () => {
                    document.querySelectorAll("button[disabled]").forEach(l => {
                        l.removeAttribute("disabled"),
                        l.setAttribute("data-blnk-disabled", "")
                    }
                    )
                }
                )) : (I(),
                document.querySelectorAll("[data-blnk-disabled]").forEach(p => {
                    p.removeAttribute("data-blnk-disabled"),
                    p.setAttribute("disabled", "")
                }
                ),
                document.querySelectorAll(`[${c.HOVERED_ATTR}], [data-full-width]`).forEach(p => {
                    p.hasAttribute(c.SELECTED_ATTR) || (a(p),
                    p instanceof HTMLElement && (p.style.cursor = ""))
                }
                ),
                e.reset()));
                break;
            case "UPDATE_SELECTED_ELEMENTS":
                if (!Array.isArray(n.data.payload)) {
                    console.error("Invalid payload for UPDATE_SELECTED_ELEMENTS");
                    return
                }
                document.querySelectorAll(`[${c.SELECTED_ATTR}], [${c.HOVERED_ATTR}]`).forEach(l => {
                    l.removeAttribute(c.SELECTED_ATTR),
                    l.removeAttribute(c.HOVERED_ATTR),
                    l.removeAttribute("data-full-width")
                }
                ),
                n.data.payload.forEach(l => {
                    if (!l?.filePath || !l?.lineNumber) {
                        console.error("Invalid element data:", l);
                        return
                    }
                    w({
                        filePath: l.filePath,
                        lineNumber: l.lineNumber,
                        col: l.col
                    }).forEach(m => {
                        m.setAttribute(c.SELECTED_ATTR, "true"),
                        Math.abs(m.getBoundingClientRect().width - window.innerWidth) < 5 && m.setAttribute("data-full-width", "true")
                    }
                    )
                }
                );
                break;
            case "GET_SELECTOR_STATE":
                f({
                    type: "SELECTOR_STATE_RESPONSE",
                    payload: {
                        isActive: e.isActive
                    }
                });
                break;
            case "SET_ELEMENT_CONTENT":
                {
                    let {id: l, content: p} = n.data.payload;
                    w({
                        filePath: l.path,
                        lineNumber: l.line
                    }).forEach(h => {
                        h.innerHTML = p
                    }
                    )
                }
                break;
            case "SET_ELEMENT_ATTRS":
                {
                    let {id: l, attrs: p} = n.data.payload;
                    w({
                        filePath: l.path,
                        lineNumber: l.line
                    }).forEach(h => {
                        Object.keys(p).forEach(O => {
                            h.setAttribute(O, p[O])
                        }
                        )
                    }
                    )
                }
                break;
            case "DUPLICATE_ELEMENT_REQUESTED":
                {
                    let {id: l} = n.data.payload;
                    w({
                        filePath: l.path,
                        lineNumber: l.line
                    }).forEach(m => {
                        let h = m.cloneNode(!0);
                        h.setAttribute("data-blnk-id", "x"),
                        h.setAttribute("data-blnk-tmp", "true"),
                        m.parentElement?.appendChild(h)
                    }
                    );
                    break
                }
            case "SET_STYLESHEET":
                {
                    let {stylesheet: l} = n.data.payload
                      , p = document.getElementById(c.OVERRIDE_STYLESHEET_ID);
                    if (p)
                        p.innerHTML = l;
                    else {
                        let m = document.getElementsByTagName("head")[0]
                          , h = document.createElement("style");
                        h.id = c.OVERRIDE_STYLESHEET_ID,
                        h.innerHTML = l,
                        m.appendChild(h)
                    }
                    break
                }
            case "EDIT_TEXT_REQUESTED":
                {
                    let {id: l} = n.data.payload;
                    w({
                        filePath: l.path,
                        lineNumber: l.line
                    }).forEach(m => {
                        if (!(m instanceof HTMLElement))
                            return;
                        m.setAttribute("contenteditable", "true"),
                        m.focus();
                        let h = () => {
                            f({
                                type: "ELEMENT_TEXT_UPDATED",
                                payload: {
                                    id: l,
                                    content: m.innerText
                                }
                            })
                        }
                          , O = () => {
                            m.removeAttribute("contenteditable"),
                            m.removeEventListener("input", h),
                            m.removeEventListener("blur", O)
                        }
                        ;
                        m.addEventListener("input", h),
                        m.addEventListener("blur", O)
                    }
                    );
                    break
                }
            case "HOVER_ELEMENT_REQUESTED":
                {
                    let {id: l} = n.data.payload;
                    document.querySelectorAll(`[${c.HOVERED_ATTR}]`).forEach(m => {
                        m.removeAttribute(c.HOVERED_ATTR)
                    }
                    ),
                    w({
                        filePath: l.path,
                        lineNumber: l.line
                    }).forEach(m => {
                        m.setAttribute(c.HOVERED_ATTR, "true")
                    }
                    );
                    break
                }
            case "UNHOVER_ELEMENT_REQUESTED":
                {
                    let {id: l} = n.data.payload;
                    w({
                        filePath: l.path,
                        lineNumber: l.line
                    }).forEach(m => {
                        m.removeAttribute(c.HOVERED_ATTR)
                    }
                    );
                    break
                }
            case "GET_PARENT_ELEMENT":
                {
                    let {id: l} = n.data.payload
                      , h = w({
                        filePath: l.path,
                        lineNumber: l.line
                    })[0].parentElement;
                    !h || h.id === "root" || ["HTML", "BODY"].includes(h.tagName) ? f({
                        type: "PARENT_ELEMENT",
                        payload: null
                    }) : f({
                        type: "PARENT_ELEMENT",
                        payload: D(h)
                    });
                    break
                }
            case "REQUEST_COMPONENT_TREE":
                $();
                break;
            default:
                console.warn("Unknown message type:", n.data.type)
            }
        } catch (u) {
            console.error("Error handling message:", u),
            I(),
            e.reset()
        }
    }
      , V = n => {
        e.mouseX = n.clientX,
        e.mouseY = n.clientY
    }
      , W = () => {
        f({
            type: "REQUEST_PICKER_STATE"
        }),
        f({
            type: "REQUEST_SELECTED_ELEMENTS"
        })
    }
    ;
    ( () => {
        try {
            s(),
            window.addEventListener("message", B),
            document.addEventListener("keydown", j),
            document.addEventListener("mousemove", V),
            f({
                type: "SELECTOR_SCRIPT_LOADED",
                payload: {
                    version: window.BLNK_SELECTOR_SCRIPT_VERSION
                }
            }),
            C().then( () => {
                W()
            }
            )
        } catch (n) {
            console.error("Failed to initialize selector script:", n)
        }
    }
    )();
    let x = n => {
        if (e.isActive && !(!N(n.target) || n.target.tagName.toLowerCase() === "html" || T(n.target)) && (n.preventDefault(),
        n.stopPropagation(),
        e.hoveredElement)) {
            let u = D(e.hoveredElement);
            e.hoveredElement.setAttribute(c.SELECTED_ATTR, "true"),
            Math.abs(e.hoveredElement.getBoundingClientRect().width - window.innerWidth) < 5 && e.hoveredElement.setAttribute("data-full-width", "true"),
            f({
                type: "ELEMENT_CLICKED",
                payload: u,
                isMultiSelect: n.metaKey || n.ctrlKey
            })
        }
    }
      , q = n => {
        if (!e.isActive || !N(n.target) || n.target.tagName.toLowerCase() === "html" || T(n.target))
            return;
        n.preventDefault(),
        n.stopPropagation();
        let u = D(n.target);
        f({
            type: "ELEMENT_DOUBLE_CLICKED",
            payload: u
        })
    }
}
;

/**
 * Resolve which project id(s) the badge API should be asked about.
 *
 * On *.sites.blink.new the subdomain IS the authoritative project id (or slug)
 * for this deployment, so we prefer it over any `?projectId=` baked into the
 * script URL. A script URL can carry a stale id when index.html was copied from
 * another project (e.g. remixed / template-cloned) and the embedded reference
 * wasn't rewritten — using it would honor the wrong project's "hide badge"
 * setting. Off-platform hosts (custom domains, sandbox previews) still rely on
 * the script URL param as before.
 *
 * We return an ordered list of candidates so the caller can fall back to the
 * script-baked id when the hostname doesn't resolve in the DB. This covers the
 * 7-day slug-rename grace window, when the old slug subdomain still serves
 * traffic via Cloudflare KV but no longer exists on the project row.
 */
function getBlinkProjectContextForBadge() {
    let scriptProjectId = null;
    let scriptOrigin = 'https://blink.new';
    if (import.meta.url) {
        const scriptUrl = new URL(import.meta.url);
        scriptProjectId = scriptUrl.searchParams.get('projectId');
        scriptOrigin = scriptUrl.origin;
    }
    let hostProjectId = null;
    if (typeof location !== 'undefined') {
        const host = location.hostname;
        const suf = '.sites.blink.new';
        if (host.endsWith(suf)) {
            const sub = host.slice(0, -suf.length);
            if (sub.length > 0 && !sub.includes('.')) {
                hostProjectId = sub;
            }
        }
    }
    const candidates = [];
    if (hostProjectId) candidates.push(hostProjectId);
    if (scriptProjectId && scriptProjectId !== hostProjectId) candidates.push(scriptProjectId);
    return { candidates, scriptOrigin };
}

// Function to check if badge should be hidden based on subscription status
async function shouldHideBadge() {
    // Check URL parameter of the HTML page for direct control (e.g. index.html?hideBadge=true)
    const pageUrlParams = new URLSearchParams(window.location.search);
    if (pageUrlParams.get('hideBadge') === 'true') {
        return true;
    }

    const { candidates, scriptOrigin } = getBlinkProjectContextForBadge();

    // Try candidates in order: hostname-derived id first (authoritative for this
    // deployment), then any script-baked id as a fallback for slug-rename grace
    // windows where the hostname no longer resolves in the DB.
    for (const candidate of candidates) {
        try {
            const apiUrl = `${scriptOrigin}/api/badge/check?projectId=${encodeURIComponent(candidate)}`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                cache: 'default',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return !data.showBadge; // If showBadge is false, we should hide the badge
            }
            // Non-OK (typically 404 "Project not found"): try the next candidate.
        } catch (error) {
            console.error('Blink script: Failed to check badge status. Please ensure API is reachable.', error);
            // On network error, stop trying and default to showing the badge.
            break;
        }
    }

    // Default to showing the badge if no project ID or API call failed
    return false;
}

// Function to add the Blink attribution badge
async function addBlinkBadge() {
    // Only add the badge if not running inside an iframe and shouldn't be hidden
    if (window.top !== window.self) {
        return;
    }
    
    // Check if badge should be hidden based on subscription status
    const hideBadge = await shouldHideBadge();
    if (hideBadge) {
        return;
    }

    // Check if badge container already exists to prevent duplicates
    if (document.getElementById('blink-badge-container')) {
        return;
    }

    // Create style element for badge CSS
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

      #blink-badge-container {
        position: fixed;
        bottom: 16px;
        right: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 9999;
      }

      #blink-badge-container.hidden {
        display: none;
      }

      #blink-badge-container a.watermark {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(12px);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        line-height: 1;
        box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.15), 0px 1px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        text-decoration: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      #blink-badge-container a.watermark:hover {
        transform: translateY(-1px);
        background: rgba(0, 0, 0, 0.9);
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.2), 0px 2px 8px rgba(0, 0, 0, 0.15);
      }

      #blink-badge-container .made-with {
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
        transition: color 0.3s ease;
      }

      #blink-badge-container .spacer {
        margin-left: 0.15em;
      }

      #blink-badge-container .blink {
        margin-left: 0.15em;
        font-weight: 600;
        background: linear-gradient(135deg, #ffffff, #e0e0e0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: transparent;
        transition: all 0.3s ease;
      }

      #blink-badge-container a.watermark:hover .blink {
        background: linear-gradient(135deg, #ffffff, #f0f0f0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        color: transparent;
      }

      #blink-badge-container a.watermark:hover .made-with {
        color: rgba(255, 255, 255, 0.9);
      }

      #blink-badge-container .divider {
        margin: 0 0.6rem;
        width: 1px;
        height: 14px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 0.5px;
      }

      #blink-badge-container .close-button {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
        transition: all 0.2s ease;
        padding: 0.1rem 0.2rem;
        border-radius: 4px;
        margin-left: 0.1rem;
      }

      #blink-badge-container .close-button:hover {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.1);
      }

      #blink-badge-container .close-button::before {
        content: '×';
        font-weight: bold;
        line-height: 1;
      }

      #blink-badge-container .subtitle {
        height: 1em; /* reserves space */
        margin-top: 0.5rem;
        font-family: 'Inter', sans-serif;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 500;
        letter-spacing: 0.02em;
        opacity: 0;
        transform: translateY(4px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }

      #blink-badge-container:hover .subtitle {
        opacity: 1;
        transform: translateY(0);
      }
      
      /* Visually hidden text - accessible to screen readers and SEO */
      .blink-seo-text {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

              @media (max-width: 480px) {
          #blink-badge-container {
            bottom: 12px;
            right: 12px;
          }

          #blink-badge-container a.watermark {
            font-size: 13px;
            padding: 0.45rem 0.65rem;
            border-radius: 14px;
          }

          #blink-badge-container .subtitle {
            font-size: 10px;
            margin-top: 0.4rem;
          }

          #blink-badge-container .close-button {
            font-size: 12px;
            padding: 0.05rem 0.15rem;
          }

          #blink-badge-container .divider {
            height: 12px;
            margin: 0 0.5rem;
          }
        }
    `;

    // Create badge container element
    const badgeContainer = document.createElement('div');
    badgeContainer.id = 'blink-badge-container'; // Use container ID for checking existence
    badgeContainer.className = 'badge-container';

    // Create watermark link element
    const watermarkLink = document.createElement('a');
    watermarkLink.href = 'https://blink.new?ref=blink-badge';
    watermarkLink.target = '_blank';
    watermarkLink.rel = 'noopener noreferrer';
    watermarkLink.className = 'watermark';

    // Create spans for "Made with" and "Blink"
    const madeWithSpan = document.createElement('span');
    madeWithSpan.className = 'made-with';
    madeWithSpan.textContent = 'Made with';

    const spacerSpan = document.createElement('span');
    spacerSpan.className = 'spacer';
    spacerSpan.textContent = ' ';

    const blinkSpan = document.createElement('span');
    blinkSpan.className = 'blink';
    blinkSpan.textContent = 'Blink';
    
    // Hidden SEO text (remains the same)
    const seoText = document.createElement('span');
    seoText.className = 'blink-seo-text';
    seoText.textContent = "Blink - The world's #1 AI fullstack engineer for building beautiful and functional websites, web apps, and mobile apps. Create production-ready applications with modern design, animations, and complete user experience. Integrate easily with Supabase, Firebase, Stripe, and more. Publish your app to the web in one click.";
    
    // Append spans to the link
    watermarkLink.appendChild(madeWithSpan);
    watermarkLink.appendChild(spacerSpan);
    watermarkLink.appendChild(blinkSpan);
    watermarkLink.appendChild(seoText); // Append SEO text to the link

    // Create divider
    const divider = document.createElement('div');
    divider.className = 'divider';

    // Create close button
    const closeButton = document.createElement('div');
    closeButton.className = 'close-button';
    closeButton.title = 'Hide badge';
    closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        badgeContainer.classList.add('hidden');
    });

    // Create subtitle element
    const subtitleDiv = document.createElement('div');
    subtitleDiv.className = 'subtitle';
    subtitleDiv.textContent = 'The AI App Builder';

    // Append divider and close button to the watermark link
    watermarkLink.appendChild(divider);
    watermarkLink.appendChild(closeButton);

    // Append link and subtitle to the container
    badgeContainer.appendChild(watermarkLink);
    badgeContainer.appendChild(subtitleDiv);

    // Function to append elements once DOM is ready
    const appendBadge = () => {
        // Double-check badge container doesn't exist before appending
        if (!document.getElementById('blink-badge-container')) {
             // Ensure head and body are available
             if (document.head && document.body) {
                 document.head.appendChild(style);
                 document.body.appendChild(badgeContainer); // Append the container
             } else {
                 // Retry shortly if DOM elements aren't ready
                 setTimeout(appendBadge, 50);
             }
        }
    };

    // Wait for the DOM to be ready before appending
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // DOM is already ready or nearly ready, append with a slight delay
        setTimeout(appendBadge, 0);
    } else {
        // Wait for the DOMContentLoaded event
        document.addEventListener('DOMContentLoaded', appendBadge);
    }
}

/** Script `src` may preserve ?projectId= when import.meta.url does not (some hosts / module loaders). Preview: *.sites.blink.new subdomain === project id. */
function resolveBlinkAnalyticsProjectId() {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.url) {
            const fromMeta = new URL(import.meta.url).searchParams.get('projectId');
            if (fromMeta) return fromMeta;
        }
    } catch (_) {}
    try {
        var scripts = document.querySelectorAll('script[src*="auto-engineer.js"]');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (!src) continue;
            var fromSrc = new URL(src, typeof location !== 'undefined' ? location.href : undefined).searchParams.get(
                'projectId'
            );
            if (fromSrc) return fromSrc;
        }
    } catch (_) {}
    try {
        if (typeof location !== 'undefined') {
            var host = location.hostname;
            var suf = '.sites.blink.new';
            if (host.endsWith(suf)) {
                var sub = host.slice(0, -suf.length);
                if (sub.length > 0 && sub.indexOf('.') === -1) return sub;
            }
            var suf2 = '.blinkpowered.com';
            if (host.endsWith(suf2)) {
                var sub2 = host.slice(0, -suf2.length);
                if (sub2.length > 0 && sub2.indexOf('.') === -1) return sub2;
            }
        }
    } catch (_) {}
    return null;
}

// Track pageviews for hosted projects.
// Only fires in standalone (non-iframe) mode — never inside the Blink editor.
// Sets window.__BLINK_ANALYTICS_PRESENT so the Blink SDK skips the duplicate initial pageview.
async function trackPageView() {
    var projectId = resolveBlinkAnalyticsProjectId();
    if (!projectId) return;

    // Signal to Blink SDK: boot script owns pageview tracking — don't double-count
    window.__BLINK_ANALYTICS_PRESENT = true;

    // Session ID scoped to browser tab (resets when tab closes)
    const storageKey = `_bsid_${projectId}`;
    let sid = sessionStorage.getItem(storageKey);
    if (!sid) {
        sid = Math.random().toString(36).slice(2, 11);
        sessionStorage.setItem(storageKey, sid);
    }

    const sendPageview = (pathname) => {
        const payload = new Blob(
            [JSON.stringify({ events: [{ type: 'pageview', source: 'boot', session_id: sid, pathname: pathname, referrer: document.referrer || null }] })],
            { type: 'application/json' }
        );
        navigator.sendBeacon(`https://core.blink.new/api/analytics/${encodeURIComponent(projectId)}/log`, payload);
    };

    // Initial pageview
    sendPageview(location.pathname);

    // SPA navigations — patch history API for route tracking
    const _push = history.pushState;
    const _replace = history.replaceState;
    history.pushState = function(...args) { _push.apply(history, args); sendPageview(location.pathname); };
    history.replaceState = function(...args) { _replace.apply(history, args); sendPageview(location.pathname); };
    window.addEventListener('popstate', () => sendPageview(location.pathname));
}

var ee = () => {
    if (window.top !== window.self) {
        // Running inside an iframe (Blink editor)
        M(); // URL change listener, Vite HMR error overlay
        H(); // Global error listeners
        k(); // Console interceptor
        G(); // Element selector/interaction logic
    } else {
        // Running as a standalone page
        addBlinkBadge().catch(err => console.error('Blink script: Error adding Blink badge.', err));
        trackPageView().catch(() => {}); // Pageview analytics — fire and forget
    }
};
ee();
