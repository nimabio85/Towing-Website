/**
 * Main JavaScript file for Abschleppdienst Website
 * Handles navigation, mobile menu, smooth scrolling, and form interactions
 */

(function() {
    'use strict';

    // DOM Content Loaded Event
    document.addEventListener('DOMContentLoaded', function() {
        initializeNavigation();
        initializeSmoothScrolling();
        initializeFormValidation();
        initializeMobileOptimizations();
        initializeAnimations();
        initializeAccessibility();
    });

    /**
     * Initialize navigation functionality
     */
    function initializeNavigation() {
        const navbar = document.getElementById('mainNav');
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');

        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Close mobile menu when clicking on menu items
        if (navbarCollapse) {
            const navLinks = navbarCollapse.querySelectorAll('.nav-link');
            navLinks.forEach(function(link) {
                link.addEventListener('click', function() {
                    if (window.innerWidth < 992) {
                        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                            hide: true
                        });
                    }
                });
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                if (!navbarCollapse.contains(event.target) && !navbarToggler.contains(event.target)) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                        hide: true
                    });
                }
            }
        });
    }

    /**
     * Initialize smooth scrolling for anchor links
     */
    function initializeSmoothScrolling() {
        // Smooth scrolling for anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Skip if it's just #
                if (href === '#') {
                    e.preventDefault();
                    return;
                }

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    const navbar = document.getElementById('mainNav');
                    const navbarHeight = navbar ? navbar.offsetHeight : 76;
                    const targetPosition = target.offsetTop - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /**
     * Initialize form validation and enhancement
     */
    function initializeFormValidation() {
        const contactForm = document.querySelector('.contact-form');
        
        if (contactForm) {
            contactForm.addEventListener('submit', function(e) {
                if (!contactForm.checkValidity()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                contactForm.classList.add('was-validated');
            });

            // Enhanced phone number formatting
            const phoneInput = contactForm.querySelector('input[type="tel"]');
            if (phoneInput) {
                phoneInput.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    
                    // Format German phone number
                    if (value.length > 0) {
                        if (value.startsWith('49')) {
                            value = '+49 ' + value.substring(2);
                        } else if (value.startsWith('0')) {
                            value = '+49 ' + value.substring(1);
                        }
                    }
                    
                    e.target.value = value;
                });
            }

            // Real-time email validation
            const emailInput = contactForm.querySelector('input[type="email"]');
            if (emailInput) {
                emailInput.addEventListener('blur', function(e) {
                    const email = e.target.value;
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    
                    if (email && !emailRegex.test(email)) {
                        e.target.setCustomValidity('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
                    } else {
                        e.target.setCustomValidity('');
                    }
                });
            }
        }
    }

    /**
     * Initialize mobile-specific optimizations
     */
    function initializeMobileOptimizations() {
        // WhatsApp button functionality
        const whatsappButton = document.querySelector('.whatsapp-button');
        if (whatsappButton) {
            whatsappButton.addEventListener('click', function(e) {
                const phoneNumber = '+4930123456789';
                const message = encodeURIComponent('Hallo, ich benötige Hilfe vom Abschleppdienst.');
                const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`;
                
                window.open(whatsappUrl, '_blank');
            });
        }

        // Click-to-call enhancement
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        phoneLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                // Add analytics tracking if needed
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'phone_call', {
                        'event_category': 'contact',
                        'event_label': this.getAttribute('href')
                    });
                }
            });
        });

        // Optimize images for mobile
        const images = document.querySelectorAll('img');
        images.forEach(function(img) {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
        });

        // Handle mobile viewport height issues
        function setVH() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }

    /**
     * Initialize animations and visual effects
     */
    function initializeAnimations() {
        // Intersection Observer for fade-in animations
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Observe elements for animation
            const animateElements = document.querySelectorAll('.service-card, .team-card, .advantage-card');
            animateElements.forEach(function(el) {
                observer.observe(el);
            });
        }

        // Add loading states
        const buttons = document.querySelectorAll('.btn[type="submit"]');
        buttons.forEach(function(button) {
            button.addEventListener('click', function() {
                if (this.form && this.form.checkValidity()) {
                    this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Wird gesendet...';
                    this.disabled = true;
                }
            });
        });
    }

    /**
     * Initialize accessibility features
     */
    function initializeAccessibility() {
        // Skip link functionality
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView();
                }
            });
        }

        // Improve keyboard navigation
        const focusableElements = document.querySelectorAll(
            'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach(function(element) {
            element.addEventListener('keydown', function(e) {
                // Handle Enter key on buttons
                if (e.key === 'Enter' && this.tagName === 'BUTTON') {
                    this.click();
                }
            });
        });

        // Announce page changes for screen readers
        const announceRegion = document.createElement('div');
        announceRegion.setAttribute('aria-live', 'polite');
        announceRegion.setAttribute('aria-atomic', 'true');
        announceRegion.className = 'sr-only';
        document.body.appendChild(announceRegion);

        // Flash message accessibility
        const flashMessages = document.querySelectorAll('.alert');
        flashMessages.forEach(function(message) {
            message.setAttribute('role', 'alert');
            
            // Auto-dismiss success messages
            if (message.classList.contains('alert-success')) {
                setTimeout(function() {
                    const bsAlert = new bootstrap.Alert(message);
                    bsAlert.close();
                }, 5000);
            }
        });
    }

    /**
     * Utility functions
     */
    
    // Debounce function for performance optimization
    function debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                }
            }, 0);
        });
    }

    // Error handling
    window.addEventListener('error', function(e) {
        console.error('JavaScript error:', e.error);
        // In production, you might want to send this to an error tracking service
    });

    // Service Worker registration (if you decide to add PWA features)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            // Uncomment to enable service worker
            // navigator.serviceWorker.register('/sw.js');
        });
    }

})();

// CSS for animations (added via JavaScript to avoid FOUC)
(function() {
    const animationCSS = `
        .service-card,
        .team-card,
        .advantage-card {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .service-card.animate-in,
        .team-card.animate-in,
        .advantage-card.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .loaded {
            transition: opacity 0.3s ease;
        }
        
        @media (prefers-reduced-motion: reduce) {
            .service-card,
            .team-card,
            .advantage-card {
                opacity: 1;
                transform: none;
                transition: none;
            }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = animationCSS;
    document.head.appendChild(style);
})();

/* =============================================
   AI CHAT WIDGET
   ============================================= */
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        const toggleBtn   = document.getElementById('chatToggle');
        const chatWindow  = document.getElementById('chatWindow');
        const closeBtn    = document.getElementById('chatClose');
        const input       = document.getElementById('chatInput');
        const sendBtn     = document.getElementById('chatSend');
        const messages    = document.getElementById('chatMessages');
        const badge       = document.getElementById('chatBadge');
        const quickReplies = document.getElementById('quickReplies');
        const openIcon    = toggleBtn ? toggleBtn.querySelector('.chat-open-icon') : null;
        const closeIcon   = toggleBtn ? toggleBtn.querySelector('.chat-close-icon') : null;

        if (!toggleBtn || !chatWindow) return;

        let isOpen = false;

        function openChat() {
            isOpen = true;
            chatWindow.classList.add('open');
            if (badge) badge.style.display = 'none';
            if (openIcon) openIcon.classList.add('d-none');
            if (closeIcon) closeIcon.classList.remove('d-none');
            scrollToBottom();
            if (input) input.focus();
        }

        function closeChat() {
            isOpen = false;
            chatWindow.classList.remove('open');
            if (openIcon) openIcon.classList.remove('d-none');
            if (closeIcon) closeIcon.classList.add('d-none');
        }

        toggleBtn.addEventListener('click', function() {
            isOpen ? closeChat() : openChat();
        });

        if (closeBtn) closeBtn.addEventListener('click', closeChat);

        // Quick reply buttons
        if (quickReplies) {
            quickReplies.querySelectorAll('.quick-reply-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const msg = btn.getAttribute('data-msg');
                    if (msg) sendMessage(msg);
                });
            });
        }

        // Send on button click
        if (sendBtn) sendBtn.addEventListener('click', function() {
            const text = input ? input.value.trim() : '';
            if (text) sendMessage(text);
        });

        // Send on Enter key
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const text = input.value.trim();
                    if (text) sendMessage(text);
                }
            });
        }

        function getCurrentTime() {
            const now = new Date();
            return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        }

        function appendMessage(text, role) {
            const wrapper = document.createElement('div');
            wrapper.className = 'chat-msg ' + role;

            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble';
            // Convert **bold** markdown and newlines to HTML
            bubble.innerHTML = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');

            const timeEl = document.createElement('div');
            timeEl.className = 'chat-time';
            timeEl.textContent = getCurrentTime();

            wrapper.appendChild(bubble);
            wrapper.appendChild(timeEl);
            messages.appendChild(wrapper);
            scrollToBottom();
            return wrapper;
        }

        function showTyping() {
            const wrapper = document.createElement('div');
            wrapper.className = 'chat-msg bot typing-indicator';
            wrapper.id = 'typingIndicator';
            wrapper.innerHTML = '<div class="chat-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
            messages.appendChild(wrapper);
            scrollToBottom();
        }

        function removeTyping() {
            const el = document.getElementById('typingIndicator');
            if (el) el.remove();
        }

        function scrollToBottom() {
            messages.scrollTop = messages.scrollHeight;
        }

        function sendMessage(text) {
            if (!text) return;
            if (input) input.value = '';
            // Hide quick replies after first user message
            if (quickReplies) quickReplies.style.display = 'none';

            appendMessage(text, 'user');
            showTyping();

            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                removeTyping();
                appendMessage(data.reply || 'Es tut mir leid, ich konnte keine Antwort generieren.', 'bot');
            })
            .catch(function() {
                removeTyping();
                appendMessage('Verbindungsfehler. Bitte rufen Sie uns direkt an.', 'bot');
            });
        }
    });
})();
