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
  
  // Check if it's a post page (for progress bar)
  const isPostPage = html.includes('post-content') || html.includes('post-full-content')
  
  // Create optimized injection - CSS stays the same
  const optimizedInjection = `
<!-- Optimized Font Loading -->
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&f[]=clash-display@700&f[]=sharpie@900&f[]=erode@300,400,500,600,700&f[]=azeret-mono@900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Cal+Sans&display=swap" rel="stylesheet">

<style>
/* CSS stays the same as in previous answer */
/* ... */
</style>

<script data-cfasync="false">
// Fixed TOC Scroller and Progress Bar
(function() {
  // Initialize when DOM is ready
  function init() {
    // Only add progress bar on post pages
    ${isPostPage ? `
    // Create progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'post-progress-container';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'post-progress-bar';
    
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);
    
    // Track post content for progress calculation
    const postContent = document.querySelector('.post-content, .post-full-content');
    
    // Calculate and update progress
    function updateProgress() {
      if (postContent) {
        const postHeight = postContent.offsetHeight;
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const contentOffset = postContent.offsetTop;
        
        const scrollableDistance = postHeight - windowHeight;
        const currentPosition = scrollPosition - contentOffset;
        
        let percentage = (currentPosition / scrollableDistance) * 100;
        percentage = Math.min(100, Math.max(0, percentage));
        
        progressBar.style.width = percentage + '%';
      }
    }
    
    // Update progress on scroll
    window.addEventListener('scroll', function() {
      requestAnimationFrame(updateProgress);
    });
    window.addEventListener('resize', updateProgress);
    
    // Initial update
    updateProgress();
    ` : ''}
    
    // TOC functionality with more robust handling
    function initTOCScroller() {
      const tocContainer = document.querySelector('.toc-container');
      const tocList = document.querySelector('.toc-list');
      const tocLinks = Array.from(document.querySelectorAll('.toc-list a'));
      
      if (!tocContainer || !tocList || tocLinks.length === 0) {
        // If TOC isn't ready yet, try again later
        setTimeout(initTOCScroller, 500);
        return;
      }
      
      let currentActiveLink = null;
      
      // Function to scroll TOC to active link
      function scrollToLink(link) {
        if (!link) return;
        
        const linkRect = link.getBoundingClientRect();
        const tocRect = tocList.getBoundingClientRect();
        const linkTop = link.offsetTop;
        
        const targetScroll = linkTop - (tocRect.height / 2) + (linkRect.height / 2);
        
        // Force scroll to link position
        tocList.scrollTop = targetScroll;
        try {
          tocList.scroll({
            top: targetScroll,
            behavior: 'smooth'
          });
        } catch (e) {
          tocList.scrollTop = targetScroll;
        }
      }
      
      // Function to update active link in TOC
      function updateActiveLink() {
        // Use this instead of window.scrollY to handle more browsers
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // Get all section elements 
        const sections = Array.from(document.querySelectorAll('h2, h3, h4'));
        
        if (sections.length === 0) return;
        
        // Find the current section
        let currentSection = null;
        let minDistance = Infinity;
        
        sections.forEach(section => {
          // Get absolute position relative to document
          const sectionTop = section.getBoundingClientRect().top + scrollY;
          // Calculate distance from viewport top + 100px offset
          const distance = Math.abs(sectionTop - scrollY - 100);
          
          if (distance < minDistance) {
            minDistance = distance;
            currentSection = section;
          }
        });
        
        // Find the link corresponding to the current section
        if (currentSection) {
          const sectionId = currentSection.getAttribute('id');
          if (!sectionId) return;
          
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
      
      // Handle clicks on TOC links
      tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          // Small delay to let browser navigate to anchor
          setTimeout(() => scrollToLink(link), 100);
        });
      });
      
      // Use passive event for better performance
      window.addEventListener('scroll', function() {
        // Debounce for performance but not too much to feel unresponsive
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateActiveLink, 50);
      }, { passive: true });
      
      window.addEventListener('resize', function() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateActiveLink, 100);
      }, { passive: true });
      
      // Initial update
      updateActiveLink();
      
      // Also run periodically as a safety net
      // This helps with dynamic content or late-loading elements
      const periodicUpdate = setInterval(updateActiveLink, 1000);
      
      // Stop the interval after 30 seconds to save resources
      setTimeout(() => clearInterval(periodicUpdate), 30000);
    }
    
    // Debounce variables
    let scrollTimeout;
    let resizeTimeout;
    
    // Try initializing right away
    initTOCScroller();
    
    // Also try after a longer delay (for slow loading sites)
    setTimeout(initTOCScroller, 1000);
    setTimeout(initTOCScroller, 3000);
  }
  
  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also run on load as a failsafe
  window.addEventListener('load', init);
})();
</script>
`

  // Insert optimized injection before </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', optimizedInjection + '</head>')
  }
  
  // Create new response
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
}
