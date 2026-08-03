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

// ===== ВАШ CLOUDFLARE WORKERS PROXY =====
// ЗАМЕНИТЕ НА СВОЙ URL!
const CLOUDFLARE_PROXY = 'https://round-cell-ba3ctodublin-calendar-proxy.qwebdog.workers.dev';

// ===== КЭШИРОВАНИЕ =====
const CACHE_KEY = 'todublin_calendar_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 час

function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION) {
      console.log('✅ Данные из кэша (возраст:', Math.round(age / 1000), 'сек)');
      return data;
    }
    
    console.log('⚠️ Кэш устарел');
    return null;
  } catch (e) {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
    console.log('💾 Данные сохранены в кэш');
  } catch (e) {
    console.warn('Не удалось сохранить в кэш:', e);
  }
}

// ===== ЗАГРУЗКА ICAL ЧЕРЕЗ CLOUDFLARE =====
async function fetchICal() {
  const proxyUrl = CLOUDFLARE_PROXY + '?url=' + encodeURIComponent(ICAL_URL);
  
  try {
    const response = await fetch(proxyUrl, {
      signal: AbortSignal.timeout(10000) // 10 секунд
    });
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    
    const text = await response.text();
    
    if (text.includes('BEGIN:VCALENDAR')) {
      console.log('✅ Успешно загружено через Cloudflare Workers');
      return text;
    } else {
      throw new Error('Неверный формат iCal');
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    throw error;
  }
}

// ===== ПАРСИНГ ICAL =====
function parseICalEvents(icsData) {
  try {
    const jcalData = ICAL.parse(icsData);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');

    return vevents.map(vevent => {
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
        textColor: '#F7F3EE',
        display: 'background'
      };
    });
  } catch (error) {
    console.error('Ошибка парсинга iCal:', error);
    return [];
  }
}

// ===== ПРЕДЗАГРУЗКА ДАННЫХ =====
let calendarDataPromise = null;

function preloadCalendarData() {
  calendarDataPromise = (async () => {
    const cached = getCache();
    if (cached) {
      return { events: cached, fromCache: true };
    }
    
    try {
      const icsData = await fetchICal();
      const events = parseICalEvents(icsData);
      setCache(events);
      return { events, fromCache: false };
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      return { events: [], fromCache: false, error: true };
    }
  })();
  
  return calendarDataPromise;
}

// Начинаем предзагрузку сразу
preloadCalendarData();

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

  // ===== КАЛЕНДАРЬ FULLCALENDAR =====
  const calendarLoader = document.getElementById('calendarLoader');
  const customCalendar = document.getElementById('customCalendar');
  
  function showLoader() {
    if (calendarLoader) calendarLoader.style.display = 'flex';
    if (customCalendar) customCalendar.style.display = 'none';
  }
  
  function hideLoader() {
    if (calendarLoader) calendarLoader.style.display = 'none';
    if (customCalendar) customCalendar.style.display = 'block';
  }

  function initCalendar() {
    if (!customCalendar || customCalendar.dataset.initialized === 'true') return;

    const isMobile = isMobileDevice();

    const calendar = new FullCalendar.Calendar(customCalendar, {
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
      height: isMobile ? 'auto' : 500,
      events: async function(fetchInfo, successCallback, failureCallback) {
        try {
          const result = await calendarDataPromise;
          
          if (result.events.length > 0) {
            console.log('✅ Событий:', result.events.length, 
                       result.fromCache ? '(кэш)' : '(сеть)');
            successCallback(result.events);
          } else if (result.error) {
            console.warn('⚠️ Ошибка загрузки — календарь пуст');
            successCallback([]); // ПУСТОЙ КАЛЕНДАРЬ (без демо!)
          } else {
            successCallback([]);
          }
          
          if (result.fromCache) {
            backgroundRefresh(calendar);
          }
          
        } catch (error) {
          console.error('Ошибка:', error);
          successCallback([]); // ПУСТОЙ КАЛЕНДАРЬ
        } finally {
          hideLoader();
        }
      },
      eventClick: function(info) {
        if (!isMobile) {
          alert('Дата занята');
        }
      }
    });

    calendar.render();
    customCalendar.dataset.initialized = 'true';
  }

  // Фоновое обновление
  function backgroundRefresh(calendarInstance) {
    console.log('🔄 Фоновое обновление...');
    
    fetchICal().then(icsData => {
      const freshEvents = parseICalEvents(icsData);
      setCache(freshEvents);
      
      calendarInstance.removeAllEvents();
      calendarInstance.addEventSource(freshEvents);
      
      console.log('✅ Обновлён в фоне');
    }).catch(error => {
      console.warn('⚠️ Фоновое обновление не удалось:', error);
    });
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
