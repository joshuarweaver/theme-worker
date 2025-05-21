addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    // Get cookies from request to check theme preference
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...value] = c.split('=');
        return [key, value.join('=')];
      }).filter(c => c[0] !== '')
    );
    
    // Get user's theme preference from cookie
    const themePref = cookies['theme-preference'];
    
    // Get system preference from User-Agent if possible (not always reliable)
    const userAgent = request.headers.get('User-Agent') || '';
    const mightPreferDark = userAgent.includes('Dark') || false;
    
    // Decide which theme to use
    const prefersDark = themePref === 'dark' || (themePref !== 'light' && mightPreferDark);
    
    // Get the original response
    const response = await fetch(request);
    
    // Only modify HTML content
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return response;
    }
  
    // Get the HTML content
    const originalBody = await response.text();
    
    // The CSS to inject for preventing theme flashing
    const themeCss = `
      <style id="theme-flash-prevention">
        /* Prevent transitions during load */
        html, body, * { transition: none !important; }
        
        /* Set initial colors based on preference */
        ${prefersDark ? `
          html, body {
            background-color: #121212 !important;
            color: #f5f5f5 !important;
          }
          .toc-container, .site-header, nav, footer {
            background-color: #1a1a1a !important;
            color: #f5f5f5 !important;
          }
        ` : `
          html, body {
            background-color: #ffffff !important;
            color: #2b2b2b !important;
          }
          .toc-container, .site-header, nav, footer {
            background-color: #f8f8f8 !important;
            color: #2b2b2b !important;
          }
        `}
        
        /* JavaScript to restore transitions after load */
        @media screen {
          html.theme-loaded * { transition: all 0.2s ease; }
        }
      </style>
    `;
    
    // The script for ensuring theme consistency and handling toggle
    const themeScript = `
      <script data-cfasync="false">
      (function() {
        // Process theme immediately
        function applyTheme() {
          // Check localStorage first (for toggle)
          const storedTheme = localStorage.getItem('darkMode');
          
          // Check cookie second (for page refreshes)
          function getCookie(name) {
            const value = "; " + document.cookie;
            const parts = value.split("; " + name + "=");
            if (parts.length === 2) return parts.pop().split(";").shift();
            return null;
          }
          const cookieTheme = getCookie('theme-preference');
          
          // Get system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          
          // Determine final theme (with priority: localStorage > cookie > system)
          let isDark = false;
          if (storedTheme === 'true') isDark = true;
          else if (storedTheme === 'false') isDark = false;
          else if (cookieTheme === 'dark') isDark = true;
          else if (cookieTheme === 'light') isDark = false;
          else isDark = prefersDark;
          
          // Apply theme
          if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.add('dark-mode');
            document.documentElement.setAttribute('data-theme', 'dark');
            document.cookie = "theme-preference=dark;path=/;max-age=31536000";
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.setAttribute('data-theme', 'light');
            document.cookie = "theme-preference=light;path=/;max-age=31536000";
          }
          
          // Mark as loaded to restore transitions
          document.documentElement.classList.add('theme-loaded');
          
          return isDark;
        }
        
        // Apply theme immediately
        applyTheme();
        
        // Reapply after DOMContentLoaded to catch any toggle events
        document.addEventListener('DOMContentLoaded', function() {
          // Listen for theme toggle clicks
          document.addEventListener('click', function(e) {
            // Check if click target is a theme toggle
            const toggle = e.target.closest('.theme-toggle, [data-theme-toggle], .dark-mode-toggle');
            if (toggle) {
              setTimeout(function() {
                applyTheme();
              }, 50);
            }
          });
        });
      })();
      </script>
    `;
    
    // Inject our CSS and script into the head
    let modifiedBody;
    if (originalBody.includes('</head>')) {
      modifiedBody = originalBody.replace('</head>', `${themeCss}${themeScript}</head>`);
    } else {
      modifiedBody = `${themeCss}${themeScript}${originalBody}`;
    }
    
    // Add appropriate classes to HTML tag
    if (prefersDark) {
      modifiedBody = modifiedBody.replace('<html', '<html class="dark dark-mode" data-theme="dark"');
    }
    
    // Create new response
    const newResponse = new Response(modifiedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    return newResponse;
  }