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
  
  // Get HTML content
  let html = await response.text()
  
  // Create a more targeted injection that won't break functionality
  const themeInjection = `
<script data-cfasync="false">
// Preserve existing dark mode preference
(function() {
  // Get stored preference or system preference
  const storedPreference = localStorage.getItem('darkMode');
  const cookiePreference = "${darkModeCookie}" === "true";
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Determine theme (priority: localStorage > cookie > system)
  const isDark = storedPreference === 'true' || 
               (storedPreference !== 'false' && 
                (cookiePreference || systemPreference));
  
  // Apply theme immediately
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    // Only add body class if needed for theme
    if (window.onload) {
      const oldOnload = window.onload;
      window.onload = function() {
        oldOnload();
        document.body.classList.add('dark-mode');
      };
    }
  }
})();
</script>
<style id="flash-prevention">
  /* Only apply background color to prevent flash */
  html.dark, html[data-theme="dark"] {
    background-color: #121212 !important;
  }
  
  body.dark-mode, html.dark body {
    background-color: #121212 !important;
  }
  
  /* Theme-specific elements */
  html.dark .toc-container, 
  html[data-theme="dark"] .toc-container,
  html.dark .site-header,
  html[data-theme="dark"] .site-header {
    background-color: #1a1a1a !important;
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