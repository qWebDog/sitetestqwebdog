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

// ===== ICAL ССЫЛКА ИЗ ЯНДЕКС.КАЛЕНДАРЯ =====
const ICAL_URL = 'https://calendar.yandex.ru/export/ics.xml?private_token=8c436274898397b54fd84b20ad7359b52b9f5194&tz_id=Europe/Moscow';

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

  // ===== ГАЛЕРЕЯ: ЭФФЕКТ СТОПКИ POLAROID (СИММЕТРИЧНЫЙ) =====
  const galleryTrack = document.getElementById('galleryTrack');
  const galleryCarousel = document.getElementById('galleryCarousel');
  
  if (galleryTrack && galleryCarousel) {
    const slides = galleryTrack.querySelectorAll('.gallery__slide');
    const prevBtn = galleryCarousel.querySelector('.gallery__arrow--prev');
    const nextBtn = galleryCarousel.querySelector('.gallery__arrow--next');
    
    let currentIndex = 0;
    let isAnimating = false;
    let autoPlayInterval;
    const AUTO_PLAY_DELAY = 3000;
    const ANIMATION_DURATION = 500;

    // Расставляет все слайды по стопке без анимации
    function updateStack() {
      slides.forEach((slide, index) => {
        // Сбрасываем стили и классы
        slide.style.transition = '';
        slide.classList.remove('active', 'next', 'next-2', 'hidden', 'fly-out-right', 'fly-out-left');
        
        let diff = (index - currentIndex + slides.length) % slides.length;
        
        if (diff === 0) {
          slide.classList.add('active');
        } else if (diff === 1) {
          slide.classList.add('next');
        } else if (diff === 2) {
          slide.classList.add('next-2');
        } else {
          slide.classList.add('hidden');
        }
      });
    }

    // Следующий слайд: текущий улетает вправо, новый приезжает слева
    function nextSlide() {
      if (isAnimating) return;
      isAnimating = true;
      
      const currentSlide = slides[currentIndex];
      const nextIndex = (currentIndex + 1) % slides.length;
      const nextSlideEl = slides[nextIndex];
      
      // 1. Текущее фото улетает вправо за экран
      currentSlide.classList.remove('active', 'next', 'next-2', 'hidden');
      currentSlide.classList.add('fly-out-right');
      
      // 2. Следующее фото мгновенно позиционируем слева за экраном
      nextSlideEl.style.transition = 'none';
      nextSlideEl.classList.remove('active', 'next', 'next-2', 'hidden', 'fly-out-right');
      nextSlideEl.classList.add('fly-out-left');
      
      // Форсируем перерисовку
      void nextSlideEl.offsetWidth;
      
      // 3. Включаем transition и плавно перемещаем в центр
      nextSlideEl.style.transition = '';
      nextSlideEl.classList.remove('fly-out-left');
      nextSlideEl.classList.add('active');
      
      currentIndex = nextIndex;
      
      setTimeout(() => {
        updateStack();
        isAnimating = false;
      }, ANIMATION_DURATION);
    }

    // Предыдущий слайд: текущий улетает влево, новый приезжает справа
    function prevSlide() {
      if (isAnimating) return;
      isAnimating = true;
      
      const currentSlide = slides[currentIndex];
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      const prevSlideEl = slides[prevIndex];
      
      // 1. Текущее фото улетает влево за экран
      currentSlide.classList.remove('active', 'next', 'next-2', 'hidden');
      currentSlide.classList.add('fly-out-left');
      
      // 2. Предыдущее фото мгновенно позиционируем справа за экраном
      prevSlideEl.style.transition = 'none';
      prevSlideEl.classList.remove('active', 'next', 'next-2', 'hidden', 'fly-out-left');
      prevSlideEl.classList.add('fly-out-right');
      
      // Форсируем перерисовку
      void prevSlideEl.offsetWidth;
      
      // 3. Включаем transition и плавно перемещаем в центр
      prevSlideEl.style.transition = '';
      prevSlideEl.classList.remove('fly-out-right');
      prevSlideEl.classList.add('active');
      
      currentIndex = prevIndex;
      
      setTimeout(() => {
        updateStack();
        isAnimating = false;
      }, ANIMATION_DURATION);
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
        nextSlide(); // Свайп влево → следующее фото
      } else {
        prevSlide(); // Свайп вправо → предыдущее фото
      }
    }

    updateStack();
    startAutoPlay();
  }

    // ===== ГАЛЕРЕЯ: ЭФФЕКТ СТОПКИ POLAROID (ПЛАВНЫЙ) =====
  const galleryTrack = document.getElementById('galleryTrack');
  const galleryCarousel = document.getElementById('galleryCarousel');
  
  if (galleryTrack && galleryCarousel) {
    const slides = galleryTrack.querySelectorAll('.gallery__slide');
    const prevBtn = galleryCarousel.querySelector('.gallery__arrow--prev');
    const nextBtn = galleryCarousel.querySelector('.gallery__arrow--next');
    
    let currentIndex = 0;
    let isAnimating = false;
    let autoPlayInterval;
    const AUTO_PLAY_DELAY = 3000;
    const ANIMATION_DURATION = 600;

    function updateStack() {
      slides.forEach((slide, index) => {
        slide.style.transition = '';
        slide.classList.remove('active', 'next', 'next-2', 'hidden', 
                              'fly-out-right', 'fly-out-left', 
                              'fade-in-right', 'fade-in-left');
        
        let diff = (index - currentIndex + slides.length) % slides.length;
        
        if (diff === 0) {
          slide.classList.add('active');
        } else if (diff === 1) {
          slide.classList.add('next');
        } else if (diff === 2) {
          slide.classList.add('next-2');
        } else {
          slide.classList.add('hidden');
        }
      });
    }

    function nextSlide() {
      if (isAnimating) return;
      isAnimating = true;
      
      const currentSlide = slides[currentIndex];
      const nextIndex = (currentIndex + 1) % slides.length;
      const nextSlideEl = slides[nextIndex];
      
      // 1. Текущее фото улетает вправо
      currentSlide.classList.remove('active', 'next', 'next-2', 'hidden');
      currentSlide.classList.add('fly-out-right');
      
      // 2. Следующее фото появляется слева с плавным fade-in
      nextSlideEl.classList.remove('active', 'next', 'next-2', 'hidden', 'fly-out-right');
      nextSlideEl.classList.add('fade-in-left');
      
      // Форсируем перерисовку
      void nextSlideEl.offsetWidth;
      
      // 3. Плавно перемещаем в центр
      nextSlideEl.classList.remove('fade-in-left');
      nextSlideEl.classList.add('active');
      
      currentIndex = nextIndex;
      
      setTimeout(() => {
        updateStack();
        isAnimating = false;
      }, ANIMATION_DURATION);
    }

    function prevSlide() {
      if (isAnimating) return;
      isAnimating = true;
      
      const currentSlide = slides[currentIndex];
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      const prevSlideEl = slides[prevIndex];
      
      // 1. Текущее фото улетает влево
      currentSlide.classList.remove('active', 'next', 'next-2', 'hidden');
      currentSlide.classList.add('fly-out-left');
      
      // 2. Предыдущее фото появляется справа с плавным fade-in
      prevSlideEl.classList.remove('active', 'next', 'next-2', 'hidden', 'fly-out-left');
      prevSlideEl.classList.add('fade-in-right');
      
      // Форсируем перерисовку
      void prevSlideEl.offsetWidth;
      
      // 3. Плавно перемещаем в центр
      prevSlideEl.classList.remove('fade-in-right');
      prevSlideEl.classList.add('active');
      
      currentIndex = prevIndex;
      
      setTimeout(() => {
        updateStack();
        isAnimating = false;
      }, ANIMATION_DURATION);
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

    updateStack();
    startAutoPlay();
  }
