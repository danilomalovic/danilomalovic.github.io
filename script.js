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
    const previewInputs = contactForm.querySelectorAll('[data-preview]');
    const previewTargetMap = {};

    contactForm.querySelectorAll('[data-preview-value]').forEach(node => {
      const key = node.dataset.previewValue;

      if (!key) {
        return;
      }

      if (!previewTargetMap[key]) {
        previewTargetMap[key] = [];
      }

      previewTargetMap[key].push(node);
    });

    const previewVibes = contactForm.querySelector('[data-preview-vibes]');
    const vibeField = contactForm.querySelector('#contact-vibe');
    const topicButtons = contactForm.querySelectorAll('.topic-chip');

    const getCleanValue = element => {
      if (!element || typeof element.value !== 'string') {
        return '';
      }

      const raw = element.value;

      if (element.tagName === 'TEXTAREA') {
        const trimmed = raw.trim();
        return trimmed.length > 0 ? trimmed : '';
      }

      if (element.type === 'email') {
        return raw.replace(/\s+/g, '').trim();
      }

      return raw.replace(/\s+/g, ' ').trim();
    };

    const updatePreviewForInput = element => {
      const key = element.dataset.preview;

      if (!key) {
        return;
      }

      const targets = previewTargetMap[key];

      if (!targets) {
        return;
      }

      const value = getCleanValue(element);
      const hasContent = value.length > 0;

      targets.forEach(target => {
        const placeholder = target.dataset.placeholder || '';
        const nextValue = hasContent ? value : placeholder;
        target.textContent = nextValue;

        if (target.classList.contains('preview-message')) {
          target.classList.toggle('has-content', hasContent);
        }
      });

      const inputWrapper = element.closest('.story-input');

      if (inputWrapper) {
        inputWrapper.classList.toggle('has-value', hasContent);
      }

      const messageWrapper = element.closest('.story-message');

      if (messageWrapper) {
        messageWrapper.classList.toggle('has-value', hasContent);
      }
    };

    previewInputs.forEach(input => {
      const handler = () => updatePreviewForInput(input);

      input.addEventListener('input', handler);
      input.addEventListener('change', handler);

      updatePreviewForInput(input);
    });

    const formatList = items => {
      if (items.length === 0) {
        return '';
      }

      if (items.length === 1) {
        return items[0];
      }

      if (items.length === 2) {
        return `${items[0]} + ${items[1]}`;
      }

      const head = items.slice(0, -1).join(', ');
      const tail = items[items.length - 1];
      return `${head} + ${tail}`;
    };

    const updateTopics = () => {
      const activeTopics = Array.from(topicButtons)
        .filter(button => button.classList.contains('is-active'))
        .map(button => button.dataset.topic)
        .filter(Boolean);

      if (vibeField) {
        vibeField.value = activeTopics.join(', ');
      }

      if (previewVibes) {
        previewVibes.textContent = activeTopics.length ? `P.S. ${formatList(activeTopics)}.` : '';
      }
    };

    topicButtons.forEach(button => {
      button.addEventListener('click', () => {
        const isActive = button.classList.toggle('is-active');
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        updateTopics();
      });
    });

    updateTopics();

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
        previewInputs.forEach(input => updatePreviewForInput(input));
        topicButtons.forEach(button => {
          button.classList.remove('is-active');
          button.setAttribute('aria-pressed', 'false');
        });
        updateTopics();
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
