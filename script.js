document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.filter-btn');
  const contents = document.querySelectorAll('.experience-content');
  const topbar = document.querySelector('.topbar');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setScrollOffset = () => {
    const headerHeight = topbar ? topbar.offsetHeight : 0;
    const offset = Math.round(headerHeight + 24);
    document.documentElement.style.setProperty('--scroll-offset', `${offset}px`);
  };

  const getScrollOffset = () => {
    const rawValue = getComputedStyle(document.documentElement).getPropertyValue('--scroll-offset');
    const parsed = parseInt(rawValue, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const scrollToTarget = target => {
    const offset = getScrollOffset();
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    });
  };

  setScrollOffset();
  window.addEventListener('resize', setScrollOffset);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;

      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      contents.forEach(section => {
        if (section.id === target) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    });
  });

  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', event => {
      const hash = link.getAttribute('href');

      if (!hash || hash === '#') {
        return;
      }

      const target = document.querySelector(hash);

      if (!target) {
        return;
      }

      event.preventDefault();
      scrollToTarget(target);

      if (history.pushState) {
        history.pushState(null, '', hash);
      } else {
        window.location.hash = hash;
      }
    });
  });

  const contactForm = document.querySelector('#contact-form');
  const formStatus = document.querySelector('#contact-form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async event => {
      event.preventDefault();

      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton ? submitButton.textContent : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending…';
      }

      if (formStatus) {
        formStatus.textContent = 'Sending your message…';
        formStatus.classList.remove('success', 'error');
      }

      try {
        const formData = new FormData(contactForm);
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Unable to submit form');
        }

        if (formStatus) {
          formStatus.textContent = "Thanks for reaching out! I'll get back to you soon.";
          formStatus.classList.add('success');
        }

        contactForm.reset();
      } catch (error) {
        if (formStatus) {
          formStatus.textContent = 'Sorry, something went wrong. Please try again or reach out via LinkedIn.';
          formStatus.classList.add('error');
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    });
  }

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);

    if (target) {
      requestAnimationFrame(() => {
        scrollToTarget(target);
      });
    }
  }
});
