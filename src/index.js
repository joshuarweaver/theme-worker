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

  // Get HTML content
  let html = await response.text()
  
  // Create injection for TOC scroller only
  const tocScrollerInjection = `
<script data-cfasync="false">
// Optimized TOC Scroller
(function() {
  // Function that runs our TOC scroller
  function initTOCScroller() {
    // Get TOC elements
    const tocContainer = document.querySelector('.toc-container');
    const tocList = document.querySelector('.toc-list');
    const tocLinks = Array.from(document.querySelectorAll('.toc-list a'));
    
    if (!tocContainer || !tocList || tocLinks.length === 0) {
      return;
    }
    
    // Create our own active tracking (don't rely on existing)
    let currentActiveLink = null;
    
    // Function to force scroll to a link
    function scrollToLink(link) {
      if (!link) return;
      
      // Get positions and dimensions
      const linkRect = link.getBoundingClientRect();
      const tocRect = tocList.getBoundingClientRect();
      const linkTop = link.offsetTop;
      
      // Calculate target scroll position (center link in view)
      const targetScroll = linkTop - (tocRect.height / 2) + (linkRect.height / 2);
      
      // Force scroll with both methods for maximum compatibility
      tocList.scrollTop = targetScroll;
      try {
        tocList.scroll({
          top: targetScroll,
          behavior: 'smooth'
        });
      } catch (e) {
        // Fallback if smooth scroll not supported
        tocList.scrollTop = targetScroll;
      }
    }
    
    // Function to update active link based on scroll position
    function updateActiveLink() {
      // Get all section elements
      const sections = Array.from(document.querySelectorAll('h2, h3'));
      
      // Find the current section
      let currentSection = null;
      let minDistance = Infinity;
      
      sections.forEach(section => {
        const distance = Math.abs(section.getBoundingClientRect().top - 100);
        if (distance < minDistance) {
          minDistance = distance;
          currentSection = section;
        }
      });
      
      // Find the link corresponding to the current section
      if (currentSection) {
        const sectionId = currentSection.getAttribute('id');
        const matchingLink = tocLinks.find(link => 
          link.getAttribute('href') === '#' + sectionId
        );
        
        if (matchingLink && matchingLink !== currentActiveLink) {
          // Clear previous active
          tocLinks.forEach(link => link.classList.remove('active'));
          
          // Set new active
          matchingLink.classList.add('active');
          currentActiveLink = matchingLink;
          
          // Scroll TOC to show this link
          scrollToLink(matchingLink);
        }
      }
    }
    
    // Set up event listeners with debounce for better performance
    let scrollTimeout;
    window.addEventListener('scroll', function() {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateActiveLink, 100);
    });
    
    // Handle clicks on TOC links
    tocLinks.forEach(link => {
      link.addEventListener('click', function() {
        setTimeout(() => scrollToLink(link), 100);
      });
    });
    
    // Force an initial update
    setTimeout(updateActiveLink, 300);
  }
  
  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTOCScroller);
  } else {
    initTOCScroller();
  }
  
  // Also try after a delay for dynamically loaded content
  setTimeout(initTOCScroller, 1000);
})();
</script>
`

  // Insert TOC scroller injection before </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', tocScrollerInjection + '</head>')
  }
  
  // Create new response
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}