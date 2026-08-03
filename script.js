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

// CORS прокси для обхода ограничений Яндекса
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

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

  // ===== ГАЛЕРЕЯ: ЭФФЕКТ СТОПКИ POLAROID =====
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

    function updateStack() {
      slides.forEach((slide, index) => {
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

    function nextSlide() {
      if (isAnimating) return;
      isAnimating = true;
      
      const currentSlide = slides[currentIndex];
      currentSlide.classList.add('fly-out-right');
      
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateStack();
        isAnimating = false;
      }, 600);
    }

    function prevSlide() {
      if (isAnimating) return;
      isAnimating = true;
      
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      const prevSlideEl = slides[prevIndex];
      const currentSlide = slides[currentIndex];
      
      slides.forEach((slide, index) => {
        if (index === currentIndex || index === prevIndex) return;
        
        let diff = (index - currentIndex + slides.length) % slides.length;
        
        if (diff === 1) {
          slide.classList.remove('next');
          slide.classList.add('next-2');
        } else if (diff === 2) {
          slide.classList.remove('next-2');
          slide.classList.add('hidden');
        } else if (diff >= 3) {
          slide.classList.remove('active', 'next', 'next-2');
          slide.classList.add('hidden');
        }
      });
      
      currentSlide.classList.remove('active');
      currentSlide.classList.add('next');
      
      prevSlideEl.classList.remove('hidden');
      prevSlideEl.classList.add('active');
      
      currentIndex = prevIndex;
      
      setTimeout(() => {
        isAnimating = false;
      }, 600);
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

  // ===== КАЛЕНДАРЬ FULLCALENDAR С ЯНДЕКС СИНХРОНИЗАЦИЕЙ =====
  function initCalendar() {
    const calendarEl = document.getElementById('customCalendar');
    if (!calendarEl || calendarEl.dataset.initialized === 'true') return;

    const isMobile = isMobileDevice();

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'ru',
      headerToolbar: {
        left: 'prev,next',
        center: 'title',
        right: isMobile ? '' : 'today dayGridMonth,timeGridWeek'
      },
      buttonText: {
        today: 'Сегодня',
        month: 'Месяц',
        week: 'Неделя'
      },
      firstDay: 1,
      height: isMobile ? 420 : 500,
      events: async function(fetchInfo, successCallback, failureCallback) {
        try {
          // Используем CORS прокси для загрузки iCal
          const response = await fetch(CORS_PROXY + encodeURIComponent(ICAL_URL));
          
          if (!response.ok) {
            throw new Error('Ошибка загрузки календаря');
          }
          
          const icsData = await response.text();
          
          // Парсим iCal данные
          const jcalData = ICAL.parse(icsData);
          const vcalendar = new ICAL.Component(jcalData);
          const vevents = vcalendar.getAllSubcomponents('vevent');

          const events = vevents.map(vevent => {
            const event = new ICAL.Event(vevent);
            const startDate = event.startDate.toJSDate();
            const endDate = event.endDate ? event.endDate.toJSDate() : startDate;
            
            return {
              title: '',
              start: startDate,
              end: endDate,
              allDay: event.startDate.isDate,
              backgroundColor: '#7F180D',
              borderColor: '#7F180D',
              textColor: '#F7F3EE'
            };
          });

          console.log('Загружено событий из Яндекс.Календаря:', events.length);
          successCallback(events);
          
        } catch (error) {
          console.error('Ошибка загрузки календаря:', error);
          
          // Если не удалось загрузить — показываем демо-события
          const today = new Date();
          const demoEvents = [];
          for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + Math.floor(Math.random() * 30));
            demoEvents.push({
              title: 'Занято',
              start: date,
              allDay: true,
              backgroundColor: '#7F180D',
              borderColor: '#7F180D',
              textColor: '#F7F3EE'
            });
          }
          
          console.log('Используются демо-события:', demoEvents.length);
          successCallback(demoEvents);
        }
      },
      eventClick: function(info) {
        if (!isMobile) {
          alert('Дата занята: ' + info.event.title);
        }
      }
    });

    calendar.render();
    calendarEl.dataset.initialized = 'true';
  }

  initCalendar();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && menu.classList.contains('active')) {
      closeMenu();
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
