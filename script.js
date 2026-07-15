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
      link.addEventListener('click', closeMenu);
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
