addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Get original response
  const response = await fetch(request)
  
  // Only modify HTML
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) {
    return response
  }

  // Get cookies to determine theme preference
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...value] = c.split('=');
      return [key, value.join('=')];
    }).filter(c => c[0] !== '')
  );
  
  // Check for theme preference in cookies
  const darkModeCookie = cookies['darkMode'] === 'true' || cookies['theme-preference'] === 'dark';
  const lightModeCookie = cookies['darkMode'] === 'false' || cookies['theme-preference'] === 'light';
  
  // Get HTML content
  let html = await response.text()
  
  // Create a theme handler that properly respects both modes
  const themeInjection = `
<script data-cfasync="false">
// Theme preference handler
(function() {
  // Get stored preference or system preference
  const storedPreference = localStorage.getItem('darkMode');
  const cookieDark = "${darkModeCookie}" === "true";
  const cookieLight = "${lightModeCookie}" === "true";
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Determine theme with proper priority
  let isDark = false;
  
  // Explicit user preferences take priority
  if (storedPreference === 'true') {
    isDark = true;
  } else if (storedPreference === 'false') {
    isDark = false;
  } else if (cookieDark) {
    isDark = true;
  } else if (cookieLight) {
    isDark = false;
  } else {
    // Fall back to system preference if no explicit choice
    isDark = systemPreference;
  }
  
  // Apply theme immediately
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.cookie = "darkMode=true;path=/;max-age=31536000";
  } else {
    // Explicitly remove dark mode classes to ensure light mode
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
    document.cookie = "darkMode=false;path=/;max-age=31536000";
  }
  
  // Add a marker class to control the flash prevention styles
  document.documentElement.classList.add(isDark ? 'theme-dark' : 'theme-light');
})();
</script>
<style id="flash-prevention">
  /* Only apply to elements with the right theme class */
  html.theme-dark {
    background-color: #121212 !important;
  }
  
  html.theme-dark body {
    background-color: #121212 !important;
  }
  
  html.theme-dark .toc-container {
    background-color: #1a1a1a !important;
  }
  
  /* Light mode styles to override any incorrect dark styling */
  html.theme-light {
    background-color: #ffffff !important;
  }
  
  html.theme-light body {
    background-color: #ffffff !important;
  }
  
  html.theme-light .toc-container {
    background-color: #f8f8f8 !important;
  }
</style>
`

  // Insert theme injection before </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', themeInjection + '</head>')
  }
  
  // Create new response
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}