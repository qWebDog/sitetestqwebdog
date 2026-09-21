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

const ICAL_URL = 'https://calendar.yandex.ru/export/ics.xml?private_token=8c436274898397b54fd84b20ad7359b52b9f5194&tz_id=Europe/Moscow';
const CLOUDFLARE_PROXY = 'https://todublin-calendar-proxy.YOUR-USERNAME.workers.dev';
const CACHE_KEY = 'todublin_calendar_cache';
const CACHE_DURATION = 60 * 60 * 1000;

// ===== ПРЕЛОАДЕР =====
function hidePreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader && !preloader.classList.contains('hidden')) {
    preloader.classList.add('hidden');
    setTimeout(() => {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 500);
  }
}
window.addEventListener('load', () => setTimeout(hidePreloader, 300));
setTimeout(hidePreloader, 3000);

// ===== TOAST УВЕДОМЛЕНИЯ =====
function showToast(type, title, message, duration = 5000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<div class="toast__icon">${icons[type] || icons.info}</div><div class="toast__content"><div class="toast__title">${title}</div>${message ? `<div class="toast__message">${message}</div>` : ''}</div><button class="toast__close" aria-label="Закрыть">✕</button>`;
  container.appendChild(toast);
  const closeBtn = toast.querySelector('.toast__close');
  const hideToast = () => {
    if (toast.classList.contains('hiding')) return;
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  };
  closeBtn.addEventListener('click', hideToast);
  setTimeout(hideToast, duration);
}

// ===== МАСКА ТЕЛЕФОНА =====
function setupPhoneMask(input) {
  if (!input) return;
  input.addEventListener('focus', () => { if (!input.value) input.value = '+7 '; });
  input.addEventListener('input', () => {
    let digits = input.value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    let formatted = '+7';
    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
    if (digits.length >= 5) formatted += ') ' + digits.slice(4, 7);
    if (digits.length >= 8) formatted += '-' + digits.slice(7, 9);
    if (digits.length >= 10) formatted += '-' + digits.slice(9, 11);
    input.value = formatted;
  });
  input.addEventListener('blur', () => { if (input.value === '+7' || input.value === '+7 (') input.value = ''; });
}

// ===== ВАЛИДАЦИЯ =====
const validators = {
  name: (v) => { if (!v.trim()) return 'Введите имя'; if (v.trim().length < 2) return 'Имя слишком короткое'; return ''; },
  phone: (v) => { const digits = v.replace(/\D/g, ''); if (!digits) return 'Введите телефон'; if (digits.length < 11) return 'Введите полный номер'; return ''; },
  date: (v) => {
    if (!v) return 'Выберите дату';
    const inputDate = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate < today) return 'Дата не может быть в прошлом';
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    if (inputDate > maxDate) return 'Дата слишком далеко';
    return '';
  }
};

function validateField(input) {
  const name = input.name;
  const validator = validators[name];
  if (!validator) return true;
  const error = validator(input.value);
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  if (error) {
    input.classList.add('invalid'); input.classList.remove('valid');
    if (errorEl) { errorEl.textContent = error; errorEl.classList.add('visible'); }
    return false;
  } else {
    input.classList.remove('invalid');
    if (input.value.trim()) input.classList.add('valid'); else input.classList.remove('valid');
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
    return true;
  }
}

// ===== КАЛЕНДАРЬ =====
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) return data;
    return null;
  } catch (e) { return null; }
}
function setCache(data) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch (e) {} }
async function fetchICal() {
  const proxyUrl = CLOUDFLARE_PROXY + '?url=' + encodeURIComponent(ICAL_URL);
  const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const text = await response.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Неверный формат iCal');
  return text;
}
function parseICalEvents(icsData) {
  try {
    const jcalData = ICAL.parse(icsData);
    const vcalendar = new ICAL.Component(jcalData);
    return vcalendar.getAllSubcomponents('vevent').map(vevent => {
      const event = new ICAL.Event(vevent);
      return { title: '', start: event.startDate.toJSDate(), end: event.endDate ? event.endDate.toJSDate() : event.startDate.toJSDate(), allDay: event.startDate.isDate, backgroundColor: '#7F180D', borderColor: '#7F180D', textColor: '#F7F3EE', display: 'background' };
    });
  } catch (e) { return []; }
}
let calendarDataPromise = null;
function preloadCalendarData() {
  calendarDataPromise = (async () => {
    const cached = getCache();
    if (cached) return { events: cached, fromCache: true };
    try {
      const icsData = await fetchICal();
      const events = parseICalEvents(icsData);
      setCache(events);
      return { events, fromCache: false };
    } catch (e) { return { events: [], fromCache: false, error: true }; }
  })();
  return calendarDataPromise;
}
preloadCalendarData();

// ===== ОСНОВНОЙ КОД ПОСЛЕ ЗАГРУЗКИ DOM =====
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const close = document.getElementById('close');

  function openMenu() { menu.classList.add('active'); burger.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { menu.classList.remove('active'); burger.classList.remove('active'); document.body.style.overflow = ''; }
  if (burger && menu) burger.addEventListener('click', openMenu);
  if (close && menu) close.addEventListener('click', closeMenu);

  if (menu) {
    menu.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) { closeMenu(); setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300); }
        } else { closeMenu(); }
      });
    });
  }

  const logo = document.querySelector('.nav__logo');
  if (logo) { logo.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

  // ===== ГАЛЕРЕЯ =====
  const galleryTrack = document.getElementById('galleryTrack');
  const galleryCarousel = document.getElementById('galleryCarousel');
  if (galleryTrack && galleryCarousel) {
    const slides = galleryTrack.querySelectorAll('.gallery__slide');
    const prevBtn = galleryCarousel.querySelector('.gallery__arrow--prev');
    const nextBtn = galleryCarousel.querySelector('.gallery__arrow--next');
    let currentIndex = 0, isAnimating = false, autoPlayInterval;

    function updateStack() {
      slides.forEach((slide, index) => {
        slide.classList.remove('active', 'next', 'next-2', 'hidden', 'fly-out-right', 'fly-out-left');
        slide.style.transition = '';
        let diff = (index - currentIndex + slides.length) % slides.length;
        if (diff === 0) slide.classList.add('active');
        else if (diff === 1) slide.classList.add('next');
        else if (diff === 2) slide.classList.add('next-2');
        else slide.classList.add('hidden');
      });
    }
    function nextSlide() {
      if (isAnimating) return;
      isAnimating = true;
      slides[currentIndex].classList.add('fly-out-right');
      setTimeout(() => { currentIndex = (currentIndex + 1) % slides.length; updateStack(); isAnimating = false; }, 400);
    }
    function prevSlide() {
      if (isAnimating) return;
      isAnimating = true;
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      const prevSlideEl = slides[prevIndex];
      const currentSlide = slides[currentIndex];
      prevSlideEl.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.25s ease';
currentSlide.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.25s ease';
      slides.forEach((slide, index) => {
        if (index === currentIndex || index === prevIndex) return;
        let diff = (index - currentIndex + slides.length) % slides.length;
        if (diff === 1) { slide.classList.remove('next'); slide.classList.add('next-2'); }
        else if (diff === 2) { slide.classList.remove('next-2'); slide.classList.add('hidden'); }
        else if (diff >= 3) { slide.classList.remove('active', 'next', 'next-2'); slide.classList.add('hidden'); }
      });
      currentSlide.classList.remove('active'); currentSlide.classList.add('next');
      prevSlideEl.classList.remove('hidden'); prevSlideEl.classList.add('active');
      currentIndex = prevIndex;
      setTimeout(() => { prevSlideEl.style.transition = ''; currentSlide.style.transition = ''; updateStack(); isAnimating = false; }, 250);
    }
    function startAutoPlay() { stopAutoPlay(); autoPlayInterval = setInterval(nextSlide, 3000); }
    function stopAutoPlay() { if (autoPlayInterval) clearInterval(autoPlayInterval); }
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoPlay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoPlay(); });
    let touchStartX = 0;
    galleryCarousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; stopAutoPlay(); }, { passive: true });
    galleryCarousel.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) < 50) return;
      if (diff > 0) nextSlide(); else prevSlide();
      startAutoPlay();
    }, { passive: true });
    updateStack(); startAutoPlay();
  }

  // ===== МОДАЛКА ФОТО =====
  const zoomModal = document.getElementById('zoomModal');
  const zoomModalImage = document.getElementById('zoomModalImage');
  const zoomModalClose = document.getElementById('zoomModalClose');
  const zoomModalOverlay = document.getElementById('zoomModalOverlay');
  function openZoomModal(src, alt) {
    if (!zoomModal || !zoomModalImage) return;
    zoomModalImage.src = src; zoomModalImage.alt = alt || '';
    zoomModal.classList.add('active'); document.body.style.overflow = 'hidden';
  }
  function closeZoomModal() {
    if (!zoomModal) return;
    zoomModal.classList.remove('active'); document.body.style.overflow = '';
    setTimeout(() => { if (zoomModalImage) zoomModalImage.src = ''; }, 300);
  }
  document.querySelectorAll('.gallery__zoomable').forEach(img => {
    img.addEventListener('click', (e) => { e.stopPropagation(); openZoomModal(img.src, img.alt); });
  });
  if (zoomModalClose) zoomModalClose.addEventListener('click', closeZoomModal);
  if (zoomModalOverlay) zoomModalOverlay.addEventListener('click', closeZoomModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (zoomModal?.classList.contains('active')) closeZoomModal();
      else if (menu?.classList.contains('active')) closeMenu();
    }
  });

  // ===== КАЛЕНДАРЬ =====
  const calendarLoader = document.getElementById('calendarLoader');
  const customCalendar = document.getElementById('customCalendar');
  const dateInput = document.getElementById('date');

  function hideLoader() {
    if (calendarLoader) calendarLoader.style.display = 'none';
    if (customCalendar) customCalendar.style.display = 'block';
  }

  let calendarInstance = null;
  function initCalendar() {
    if (!customCalendar || customCalendar.dataset.initialized === 'true') return;
    const isMobile = isMobileDevice();
    calendarInstance = new FullCalendar.Calendar(customCalendar, {
      initialView: 'dayGridMonth', locale: 'ru',
      headerToolbar: { left: 'prev,next', center: 'title', right: isMobile ? '' : 'today dayGridMonth,timeGridWeek' },
      buttonText: { today: 'Сегодня', month: 'Месяц', week: 'Неделя' }, firstDay: 1, height: isMobile ? 'auto' : 500,
      events: async function(fetchInfo, successCallback) {
        try {
          const result = await calendarDataPromise;
          if (result.events.length > 0) successCallback(result.events); else successCallback([]);
          if (result.fromCache) backgroundRefresh(calendarInstance);
        } catch (e) { successCallback([]); } finally { hideLoader(); }
      },
      eventClick: function(info) {
        const clickedDate = info.event.start.toISOString().split('T')[0];
        showToast('error', 'Дата занята', 'Выберите другую дату');
      },
      dateClick: function(info) {
        const clickedDate = info.dateStr;
        const hasEvent = calendarInstance.getEvents().some(event => event.start.toISOString().split('T')[0] === clickedDate);
        if (hasEvent) {
          showToast('error', 'Дата занята', 'Выберите другую дату');
          return;
        }
        if (dateInput) {
          dateInput.value = clickedDate;
          dateInput.classList.add('valid');
          dateInput.classList.remove('invalid');
          const errorEl = document.querySelector('[data-error-for="date"]');
          if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
          
          const [y, m, d] = clickedDate.split('-');
          const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
          const formattedDate = `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
          showToast('success', 'Дата выбрана', `${formattedDate} — дата свободна`);
          
          const requestSection = document.getElementById('request');
          if (requestSection) requestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
    calendarInstance.render();
    customCalendar.dataset.initialized = 'true';
  }
  function backgroundRefresh(calendar) {
    fetchICal().then(icsData => {
      const freshEvents = parseICalEvents(icsData);
      setCache(freshEvents);
      calendar.removeAllEvents();
      calendar.addEventSource(freshEvents);
    }).catch(() => {});
  }
  initCalendar();

  // ===== ФОРМА ЗАЯВКИ =====
  const requestForm = document.getElementById('requestForm');
  const submitBtn = document.getElementById('submitBtn');
  const phoneInput = document.getElementById('phone');
  const requestStatus = document.getElementById('requestStatus');
  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');

  const FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwRSCa0XN9u2C2b1PzbP1eXsLJUWOrLoFkZBOAuxP8u_c_eQKXRNH43L0jIYm99dQZ7/exec';

  setupPhoneMask(phoneInput);

  // Обработка date picker
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    dateInput.setAttribute('max', maxDate.toISOString().split('T')[0]);
    
    dateInput.addEventListener('change', () => {
      if (dateInput.value) {
        dateInput.classList.add('valid');
        dateInput.classList.remove('invalid');
        const errorEl = document.querySelector('[data-error-for="date"]');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('visible');
        }
      }
    });
    
    dateInput.addEventListener('blur', () => validateField(dateInput));
  }

  if (requestForm) {
    requestForm.querySelectorAll('.request__form-input').forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        const errorEl = document.querySelector(`[data-error-for="${input.name}"]`);
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('visible');
        }
        if (input.classList.contains('invalid')) validateField(input);
      });
    });

    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let isValid = true;
      requestForm.querySelectorAll('[name="name"], [name="phone"], [name="date"]').forEach(input => {
        if (!validateField(input)) isValid = false;
      });

      const privacy = document.getElementById('privacy');
      const privacyError = document.querySelector('[data-error-for="privacy"]');
      if (!privacy.checked) {
        isValid = false;
        if (privacyError) { privacyError.textContent = 'Подтвердите согласие'; privacyError.classList.add('visible'); }
      } else {
        if (privacyError) { privacyError.textContent = ''; privacyError.classList.remove('visible'); }
      }

      if (!isValid) {
        showStatus('error', 'Проверьте форму', 'Пожалуйста, исправьте ошибки в полях');
        return;
      }

      requestForm.classList.add('sending');
      submitBtn.disabled = true;
      submitBtn.classList.add('loading');

      const formData = new FormData(requestForm);
      const data = Object.fromEntries(formData);

      try {
        await fetch(FORM_ENDPOINT, {
          method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        showStatus('success', 'Заявка отправлена!', 'Мы свяжемся с вами в течение 30 минут');
        requestForm.reset();
        requestForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
        
        requestForm.querySelectorAll('.request__form-error').forEach(err => {
          err.textContent = '';
          err.classList.remove('visible');
        });
        
        setTimeout(() => { hideStatus(); }, 5000);
      } catch (error) {
        console.error('Ошибка отправки:', error);
        showStatus('error', 'Ошибка отправки', 'Попробуйте ещё раз или позвоните нам');
      } finally {
        requestForm.classList.remove('sending');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  }

    let statusClickHandler = null;
  let documentClickHandler = null;

  function showStatus(type, title, message) {
    if (!requestStatus) return;
    requestStatus.className = 'request__status active request__status--' + type;
    statusIcon.innerHTML = type === 'success' ? '✓' : '✕';
    statusText.innerHTML = `<strong>${title}</strong><br>${message}`;

    // Убираем старые обработчики если есть
    removeStatusClickHandlers();

    // Для ошибок — добавляем закрытие по клику
    if (type === 'error') {
      // Клик на сам блок статуса
      statusClickHandler = (e) => {
        e.stopPropagation();
        hideStatus();
      };
      requestStatus.addEventListener('click', statusClickHandler);

      // Клик в любую часть экрана (с задержкой чтобы не сработал сразу)
      setTimeout(() => {
        documentClickHandler = () => {
          hideStatus();
        };
        document.addEventListener('click', documentClickHandler);
      }, 100);
    }
  }

  function hideStatus() {
    if (!requestStatus) return;
    requestStatus.classList.remove('active');
    removeStatusClickHandlers();
  }

  function removeStatusClickHandlers() {
    if (statusClickHandler && requestStatus) {
      requestStatus.removeEventListener('click', statusClickHandler);
      statusClickHandler = null;
    }
    if (documentClickHandler) {
      document.removeEventListener('click', documentClickHandler);
      documentClickHandler = null;
    }
  }

  // ===== КНОПКА "НАВЕРХ" =====
  const scrollTopBtn = document.getElementById('scrollTop');
  function handleScrollTopVisibility() {
    if (!scrollTopBtn) return;
    if (window.scrollY > 500) scrollTopBtn.classList.add('visible'); else scrollTopBtn.classList.remove('visible');
  }
  window.addEventListener('scroll', handleScrollTopVisibility, { passive: true });
  handleScrollTopVisibility();
  if (scrollTopBtn) { scrollTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }); }
});

let lastIsMobile = isMobileDevice();
window.addEventListener('resize', () => {
  const currentIsMobile = isMobileDevice();
  if (currentIsMobile !== lastIsMobile) {
    lastIsMobile = currentIsMobile;
    loadStyles();
    const menu = document.getElementById('menu');
    const burger = document.getElementById('burger');
    if (menu) { menu.classList.remove('active'); document.body.style.overflow = ''; }
    if (burger) burger.classList.remove('active');
  }
});
