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
    menu.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            closeMenu();
            setTimeout(() => {
              target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }, 300);
          }
        } else {
          closeMenu();
        }
      });
    });
  }

  const logo = document.querySelector('.nav__logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // ===== ГАЛЕРЕЯ: АВТОПРОКРУТКА + СВАЙПЫ =====
  const galleryTrack = document.getElementById('galleryTrack');
  const galleryCarousel = document.getElementById('galleryCarousel');
  
  if (galleryTrack && galleryCarousel) {
    const slides = galleryTrack.querySelectorAll('.gallery__slide');
    const prevBtn = galleryCarousel.querySelector('.gallery__arrow--prev');
    const nextBtn = galleryCarousel.querySelector('.gallery__arrow--next');
    let currentIndex = 0;
    let autoPlayInterval;
    const AUTO_PLAY_DELAY = 1500; // 1.5 секунды

    function updateGallery() {
      galleryTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      updateGallery();
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateGallery();
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayInterval = setInterval(nextSlide, AUTO_PLAY_DELAY);
    }

    function stopAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    }

    // Стрелки (десктоп)
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoPlay();
      });
    }

    // Свайпы (мобильная версия)
    let touchStartX = 0;
    let touchEndX = 0;

    galleryCarousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      stopAutoPlay();
    }, { passive: true });

    galleryCarousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
      startAutoPlay();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) < 50) return;

      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    // Запуск автопрокрутки
    startAutoPlay();
  }

  // ===== МОДАЛКА КАЛЕНДАРЯ =====
  const calendarModal = document.getElementById('calendarModal');
  const openCalendarModalBtn = document.getElementById('openCalendarModal');
  const closeCalendarModalBtn = document.getElementById('closeCalendarModalBtn');
  const closeCalendarModalOverlay = document.getElementById('closeCalendarModal');
  const closeModalAndBook = document.getElementById('closeModalAndBook');

  function openCalendarModal() {
    if (calendarModal) {
      calendarModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCalendarModal() {
    if (calendarModal) {
      calendarModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (openCalendarModalBtn) {
    openCalendarModalBtn.addEventListener('click', openCalendarModal);
  }

  if (closeCalendarModalBtn) {
    closeCalendarModalBtn.addEventListener('click', closeCalendarModal);
  }

  if (closeCalendarModalOverlay) {
    closeCalendarModalOverlay.addEventListener('click', closeCalendarModal);
  }

  if (closeModalAndBook) {
    closeModalAndBook.addEventListener('click', () => {
      closeCalendarModal();
      const requestSection = document.querySelector('#request');
      if (requestSection) {
        requestSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (calendarModal && calendarModal.classList.contains('active')) {
        closeCalendarModal();
      }
      if (menu && menu.classList.contains('active')) {
        closeMenu();
      }
    }
  });
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
