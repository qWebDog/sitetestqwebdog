function isMobileDevice() {
  const isSmallScreen = window.innerWidth <= 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isSmallScreen || (isTouchDevice && isMobileUA);
}

function loadStyles() {
  const link = document.getElementById('main-style');
  if (isMobileDevice()) {
    link.setAttribute('href', 'mobile.css');
  } else {
    link.setAttribute('href', 'styles.css');
  }
}

loadStyles();

document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const close = document.getElementById('close');

  function openMenu() {
    menu.classList.add('active');
    burger.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('active');
    burger.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (burger && menu) {
    burger.addEventListener('click', openMenu);
  }

  if (close && menu) {
    close.addEventListener('click', closeMenu);
  }

  if (menu) {
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        // Если это ссылка на модалку — не закрываем меню сразу
        if (link.dataset.modal) {
          e.preventDefault();
          closeMenu();
          setTimeout(() => openModal(link.dataset.modal), 300);
        } else {
          closeMenu();
        }
      });
    });
  }

  // ===== МОДАЛКИ =====
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('modal-open');

    // Инициализируем карусель внутри модалки
    const carousel = modal.querySelector('[data-carousel]');
    if (carousel && !carousel.dataset.initialized) {
      initCarousel(carousel);
      carousel.dataset.initialized = 'true';
    }
  }

  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  // Открытие модалок по кнопкам с data-modal
  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(trigger.dataset.modal);
    });
  });

  // Закрытие модалок
  document.querySelectorAll('.modal').forEach(modal => {
    modal.querySelectorAll('[data-close]').forEach(closeBtn => {
      closeBtn.addEventListener('click', () => closeModal(modal));
    });
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(closeModal);
    }
  });

  // ===== КАРУСЕЛЬ =====
  function initCarousel(carousel) {
    const track = carousel.querySelector('.carousel__track');
    const slides = carousel.querySelectorAll('.carousel__slide');
    const prevBtn = carousel.querySelector('.carousel__arrow--prev');
    const nextBtn = carousel.querySelector('.carousel__arrow--next');
    const dotsContainer = carousel.closest('.modal__content').querySelector('[data-dots]');

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    let slidesPerView = isMobileDevice() ? 1 : 3;

    function updateSlidesPerView() {
      slidesPerView = isMobileDevice() ? 1 : 3;
    }

    function getMaxIndex() {
      return Math.max(0, slides.length - slidesPerView);
    }

    function updateCarousel() {
      updateSlidesPerView();

      if (isMobileDevice()) {
        // На мобильном — горизонтальный скролл со свайпом (не используем transform)
        track.style.transform = '';
        track.style.width = '';
      } else {
        // На десктопе — transform-based карусель
        const slideWidth = 100 / slidesPerView;
        const gap = 20;
        track.style.transform = `translateX(calc(-${currentIndex * slideWidth}% - ${currentIndex * gap}px))`;
      }

      // Обновляем стрелки
      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();

      // Обновляем точки
      updateDots();
    }

    function createDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const totalDots = getMaxIndex() + 1;
      for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel__dot' + (i === currentIndex ? ' active' : '');
        dot.addEventListener('click', () => {
          currentIndex = i;
          updateCarousel();
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.carousel__dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    // Стрелки
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentIndex < getMaxIndex()) {
          currentIndex++;
          updateCarousel();
        }
      });
    }

    // Свайп для мобильной версии
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) < 50) return;

      // На мобильном свайп работает через scroll-snap, точки обновляем по scroll
      if (isMobileDevice()) {
        // Ничего не делаем — scroll-snap сам обработает
      } else {
        if (diff > 0 && currentIndex < getMaxIndex()) {
          currentIndex++;
        } else if (diff < 0 && currentIndex > 0) {
          currentIndex--;
        }
        updateCarousel();
      }
    }

    // Обновление точек при скролле на мобильном
    if (isMobileDevice()) {
      track.addEventListener('scroll', () => {
        const slideWidth = track.scrollWidth / slides.length;
        const newIndex = Math.round(track.scrollLeft / slideWidth);
        if (newIndex !== currentIndex) {
          currentIndex = newIndex;
          updateDots();
        }
      });
    }

    // Инициализация
    createDots();
    updateCarousel();

    // Обновление при ресайзе
    window.addEventListener('resize', () => {
      updateSlidesPerView();
      if (currentIndex > getMaxIndex()) {
        currentIndex = getMaxIndex();
      }
      createDots();
      updateCarousel();
    });
  }
});

let lastIsMobile = isMobileDevice();
window.addEventListener('resize', () => {
  const currentIsMobile = isMobileDevice();
  if (currentIsMobile !== lastIsMobile) {
    lastIsMobile = currentIsMobile;
    loadStyles();
    const menu = document.getElementById('menu');
    const burger = document.getElementById('burger');
    if (menu) {
      menu.classList.remove('active');
      document.body.style.overflow = '';
    }
    if (burger) {
      burger.classList.remove('active');
    }
  }
});
