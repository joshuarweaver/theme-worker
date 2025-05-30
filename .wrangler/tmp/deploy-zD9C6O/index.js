(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/index.js
  addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
  });
  async function handleRequest(request) {
    const userAgent = request.headers.get("user-agent") || "";
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Mobile/i.test(userAgent);
    const response = await fetch(request);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return response;
    }
    let html = await response.text();
    if (isMobile) {
      html = html.replace(/\/size\/w2000\//g, "/size/w600/");
      html = html.replace(/\/size\/w1600\//g, "/size/w600/");
      html = html.replace(/\/size\/w1200\//g, "/size/w500/");
      html = html.replace(/\/size\/w800\//g, "/size/w400/");
      html = html.replace(/<img[^>]*class="[^"]*decorative[^"]*"[^>]*>/gi, "");
      html = html.replace(/<script(?![^>]*defer)(?![^>]*async)(?![^>]*data-cfasync="false")([^>]*)>/gi, "<script defer$1>");
      html = html.replace(/<div[^>]*class="[^"]*desktop-only[^"]*"[^>]*>.*?<\/div>/gis, "");
    }
    html = html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
      if (attrs.includes("loading=")) return match;
      const hasFetchPriority = attrs.includes("fetchpriority=");
      const lazyAttrs = `loading="lazy" decoding="async"${hasFetchPriority ? "" : ' fetchpriority="low"'}`;
      return `<img ${attrs} ${lazyAttrs}>`;
    });
    html = html.replace(/<img([^>]+?)fetchpriority="low"/i, (match, attrs) => {
      return `<img${attrs}fetchpriority="high"`;
    });
    if (!html.includes('name="viewport"')) {
      const viewportTag = '\n    <meta name="viewport" content="width=device-width, initial-scale=1">';
      html = html.replace(/<head>/i, `<head>${viewportTag}`);
    }
    if (isMobile) {
      const criticalMobileCSS = `
<style>
/* Critical Mobile-First CSS - Inlined for instant rendering */
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
img { max-width: 100%; height: auto; }
.header, .nav { display: none !important; } /* Hide complex navigation on mobile */
.post-content, .content { padding: 10px !important; }
h1, h2, h3 { font-size: 1.5em !important; line-height: 1.3 !important; }
p { font-size: 16px !important; line-height: 1.4 !important; }
/* Minimal critical styles only */
</style>`;
      html = html.replace(/<head>/i, `<head>${criticalMobileCSS}`);
    }
    html = html.replace(
      /<link([^>]+)rel=["']stylesheet["']([^>]+)>/gi,
      (match, beforeRel, afterRel) => {
        if (match.includes("media=") || match.includes("critical") || match.includes("above-fold") || match.includes("/_worker") || match.includes("/workers/") || afterRel.includes("/_worker") || afterRel.includes("/workers/") || beforeRel.includes("/_worker") || beforeRel.includes("/workers/") || match.includes("fontshare.com")) {
          return match;
        }
        const hrefMatch = match.match(/href=["']([^"']+)["']/);
        if (hrefMatch) {
          const href = hrefMatch[1];
          if (!href.includes(".css") || href.startsWith("/_") || href.includes("/api/") || href.includes("/edge/")) {
            return match;
          }
        }
        return `<link${beforeRel}rel="preload"${afterRel} as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link${beforeRel}rel="stylesheet"${afterRel}></noscript>`;
      }
    );
    if (isMobile) {
      html = html.replace(/\n\s+/g, "\n");
      const criticalPreloads = `
<link rel="preload" as="font" href="https://api.fontshare.com/v2/css?f[]=satoshi@1,2" crossorigin>
`;
      html = html.replace(/<head>/i, `<head>${criticalPreloads}`);
    }
    const isPostPage = html.includes("post-content") || html.includes("post-full-content");
    const optimizedInjection = `

<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@1,2&display=swap" rel="stylesheet">

<style>
/* Responsive Image Optimization */
img {
  max-width: 100%;
  height: auto;
}

${isMobile ? `
/* Mobile-Optimized Styles */
* {
  font-display: swap !important;
}
body {
  font-size: 16px !important;
  line-height: 1.4 !important;
}
.logo__title {
  font-size: 2rem !important;
}
footer .logo__title {
  font-size: 2.5rem !important;
}
/* Simplified mobile layout */
.project-header__wrapper,
.page-header__wrapper {
  padding: 10px !important;
  gap: 10px !important;
}
` : ""}

/* Core Styles - Combined & Optimized */
.logo__title, footer .logo__title {
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
  font-weight: 700 !important;
  text-transform: uppercase;
}
.logo__title {
  font-size: 2.6rem;
}
footer .logo__title {
  font-size: 3.4rem;
}
.footer__description {
  font-size: 1.6rem;
  max-width: 360px;
}
.footer {
  position: relative;
  background: linear-gradient(to bottom, rgba(240, 247, 250, 0.95) 0%, rgba(225, 235, 240, 0.98) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #4a5568;
  box-shadow: 0 4px 30px rgba(0, 0, 0, .05);
  border: 1px solid hsla(0, 0%, 100%, .3);
}
.footer__header.wrapper {
  padding-top: 20px;
  padding-bottom: 50px;
}
.post-content {
  margin-left: 0px !important;
}
.author-card__info {
  display: none;
}

/* Project & Post Styles */
.project-header, .page-header, .post-header {
  background: linear-gradient(to bottom, rgba(240, 244, 248, 0.95) 0%, rgba(220, 228, 236, 0.98) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #2c3e50;
  box-shadow: 0 4px 30px rgba(0, 0, 0, .05);
  border: 1px solid hsla(0, 0%, 100%, .3);
}
html[data-theme='dark'] .project-header,
html[data-theme='dark'] .page-header,
html[data-theme='dark'] .post-header {
  background: linear-gradient(to bottom, rgba(22, 17, 12, 0.95) 0%, rgba(36, 28, 21, 0.98) 100%);
  color: #e6ddd6;
  box-shadow: 0 4px 30px rgba(0, 0, 0, .15);
  border: 1px solid hsla(0, 0%, 20%, .3);
}
.project-header__wrapper {
  gap: 25px;
}
.project-header__img-wrapper {
  padding: 20px;
}
.project-header__img {
  border-radius: 20px;
}
.project-header__img--featured {
  border-radius: 0px !important;
  transform: scale(1.06) !important;
}
.post-card__img-wrapper {
  display: none;
}
.page-header__wrapper {justify-content: center !important;
}
.section-title__title-text {
  font-size: 2.5rem;
}

.post-footer  html[data-theme='light'] & {background-color: #ffffff !important; padding: 30px !important;}
.progress-bar {background-color: #ffffff !important}

.post-footer html[data-theme='dark'] & {background-color: #E6DDD6 !important;}
.progress-bar html[data-theme='dark'] & {background-color: #211A14 !important;}

.post-content {padding-bottom: 6rem !important;}

/* Home Page & Layout */
.home-page {
  gap: 0px !important;
}
.page-header__wrapper {
  justify-content: center;
}
.featured-thought__wrapper {
  padding-top: 75px;
}
.post-page, .project-page {
  gap: 60px !important;
}
.post {width:100% !important; margin-left: 0px !important; padding-top: 0px !important;
}
.post-card__img-wrapper {display: none !important;
}
.post-footer__meta, .progress-bar-main__share {color: #212121 !important;
}
.value-props-section, .skillset-section {
  padding-top: 0px !important;
}
.skillset-section {
  padding-top: 9rem !important;
}
.featured-thought-section {
  margin-bottom: 0px !important;
}

/* Membership & Cards */
.skillset-item {
  max-width: 100% !important;
  padding: 5px !important;
}
.membership-module-section__description {
  font-size: 2.2rem !important;
}
.membership-tier-card__description {
  font-size: 1.5rem;
}
.membership-tier-card__benefit {
  font-size: 1.3rem;
}
.membership-tier-card__button {
  font-size: 2rem !important;
}
.membership-tier-card__popular {
  font-size: 1.3rem;
}
.membership-tier-card__price-per {
  font-size: 1.3rem;
}
.membership-toggle-wrapper {
  display: none !important;
}
.value-prop-card .button {
  font-size: 1.4rem !important;
}
.logo-soup-section__item {
  gap: 10px !important;
}

/* Blog & Content */
.latest-thought-list__date::before,
.latest-thought-list__reading-time::before {
  display: none;
}
.latest-thought-list__date:not(:first-child),
.latest-thought-list__reading-time:not(:first-child) {
  padding-left: 0px;
}
.featured-thought__button a::hover {
  color: #000000 !important;
}
.kg-callout-text {
  font-size: 2.3rem !important;
}
.reading-progress {
  display: none !important;
}

/* TOC Styles */
.toc-container {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  overflow: auto;
}
html[data-theme='dark'] .toc-container {
  color: #E6DDD6;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
}
.toc-title {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f9f4f4 !important;
  padding: 15px;
  font-weight: bold;
  text-align: center;
  border-radius: 5px;
  border-bottom: 1px solid #eee;
  width: 100%;
  box-sizing: border-box;
}
html[data-theme='dark'] .toc-title {
  background-color: #211A14 !important;
  border-bottom: 1px solid #2D2319;
  color: #F0E9E4;
}
.toc-list {
  flex: 1;
  overflow-y: auto;
  height: 500px;
  padding: 0 15px;
  margin: 0;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}
html[data-theme='dark'] .toc-list {
  background-color: #16110C;
}
.toc-list a {
  display: block;
  padding: 8px 10px;
  text-decoration: none;
  color: inherit;
  border-radius: 5px !important;
  transition: all 0.2s ease;
}
html[data-theme='dark'] .toc-list a {
  color: #C4B8B0 !important;
}
.toc-list a.active {
  background-color: rgba(0,0,0,0.05);
  font-weight: bold;
}
html[data-theme='dark'] .toc-list a.active {
  background-color: #2D2319;
  color: #FFFFFF !important;
}
.toc-list a:hover {
  background-color: rgba(0,0,0,0.02);
}
html[data-theme='dark'] .toc-list a:hover {
  background-color: #241C15;
  color: #E6DDD6;
}
.toc-list::-webkit-scrollbar {
  width: 4px;
  display: block !important;
}
.toc-list::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
}
html[data-theme='dark'] .toc-list::-webkit-scrollbar-thumb {
  background: #3A2E24;
}
html[data-theme='dark'] .toc-list::-webkit-scrollbar-track {
  background: #1E1713;
}

/* Progress Bar */
.post-progress-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  z-index: 1000;
  background: rgba(220, 228, 236, 0.4);
  backdrop-filter: blur(4px);
}
.post-progress-bar {
  height: 100%;
  width: 0;
  background: #2c3e50;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1);
  transition: width 0.2s ease-out;
  animation: progressGlow 3s infinite;
}
@keyframes progressGlow {
  0% { box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1); }
  50% { box-shadow: 0 1px 12px rgba(120, 140, 180, 0.2); }
  100% { box-shadow: 0 1px 8px rgba(0, 0, 0, 0.1); }
}
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
    ` : ""}
    
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
<\/script>
`;
    if (html.includes("</head>")) {
      html = html.replace("</head>", optimizedInjection + "</head>");
    }
    const optimizedResponse = new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });
    optimizedResponse.headers.set("Cache-Control", "public, max-age=3600, must-revalidate");
    optimizedResponse.headers.set("X-Content-Type-Options", "nosniff");
    optimizedResponse.headers.set("X-Frame-Options", "DENY");
    optimizedResponse.headers.set("X-XSS-Protection", "1; mode=block");
    return optimizedResponse;
  }
  __name(handleRequest, "handleRequest");
})();
//# sourceMappingURL=index.js.map
