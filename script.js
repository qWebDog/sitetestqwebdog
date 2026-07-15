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

  if (burger && menu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      menu.classList.toggle('active');
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        menu.classList.remove('active');
      });
    });
  }
});

let lastIsMobile = isMobileDevice();
window.addEventListener('resize', () => {
  const currentIsMobile = isMobileDevice();
  if (currentIsMobile !== lastIsMobile) {
    lastIsMobile = currentIsMobile;
    loadStyles();
    const burger = document.getElementById('burger');
    const menu = document.getElementById('menu');
    if (burger) burger.classList.remove('active');
    if (menu) menu.classList.remove('active');
  }
});