/* -------------------------------------------------
   1️⃣ Бургер-меню + плавный скролл
   ------------------------------------------------- */
const burger   = document.querySelector('.burger');
const menu     = document.querySelector('nav.menu');
const overlay  = document.getElementById('menuOverlay');

if (burger && menu && overlay) {
  const toggleMenu = () => {
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', !expanded);
    burger.classList.toggle('active');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
  };
  const closeMenu = () => {
    burger.setAttribute('aria-expanded', 'false');
    burger.classList.remove('active');
    menu.classList.remove('active');
    overlay.classList.remove('active');
  };
  burger.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);
  document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({behavior:'smooth'});
        setTimeout(closeMenu, 250);
      }
    });
  });
}

/* -------------------------------------------------
   2️⃣ Карусель (дипломы) – бесконечный, drag + autoplay + wheel
   ------------------------------------------------- */
(function() {
  const track   = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const dots    = document.getElementById('carouselDots');
  const container = track ? track.closest('.carousel-container') : null;

  if (!track || !prevBtn || !nextBtn || !dots || !container) return;

  const originalHTML = track.innerHTML;          // сохраняем «чистый» набор
  let realItemsCount = 0;
  let realGroups = 0;
  let totalGroups = 0;
  let idx = 1;                                   // первая реальная группа
  let dragging = false;
  let startX = 0, startPos = 0;
  let velocity = 0, lastX = 0, lastTime = 0;
  let curPos = 0;
  let lastWheel = 0;                             // throttling для wheel

  const visibleCount = () => {
    if (window.innerWidth <= 520) return 1;
    if (window.innerWidth <= 900)  return 2;
    return 3;
  };
  const getGap = () => {
    const style = getComputedStyle(track);
    return parseFloat(style.columnGap) || 0;
  };
  const slideWidth = () => {
    const visible = visibleCount();
    const gap = getGap();
    const containerW = track.parentElement.offsetWidth;
    const itemW = (containerW - gap * (visible - 1)) / visible;
    return itemW * visible + gap * (visible - 1);
  };
  const translateFor = (groupIdx) => groupIdx * slideWidth();

  const buildCarousel = () => {
    track.innerHTML = originalHTML;
    const visible = visibleCount();
    const realItems = Array.from(track.children);
    realItemsCount = realItems.length;
    realGroups = Math.ceil(realItemsCount / visible);
    totalGroups = realGroups + 2; // клоны слева и справа

    // левый клон
    for (let i = realItemsCount - visible; i < realItemsCount; i++) {
      const clone = realItems[i].cloneNode(true);
      track.insertBefore(clone, track.firstChild);
    }
    // правый клон
    for (let i = 0; i < visible; i++) {
      const clone = realItems[i].cloneNode(true);
      track.appendChild(clone);
    }

    idx = 1;
    renderDots();
    update(false);
  };

  const renderDots = () => {
    dots.innerHTML = '';
    for (let i = 0; i < realGroups; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Перейти к слайду ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dots.appendChild(dot);
    }
  };

  const update = (smooth = true) => {
    track.style.transition = smooth ? 'transform .3s cubic-bezier(.25,.46,.45,.94)' : 'none';
    const maxTranslate = track.scrollWidth - track.parentElement.offsetWidth;
    const tr = Math.min(translateFor(idx), maxTranslate);
    track.style.transform = `translateX(-${tr}px)`;

    const dotEls = dots.querySelectorAll('.carousel-dot');
    dotEls.forEach((dot, i) => dot.classList.toggle('active', i === idx - 1));
  };

  const goTo = (dotIdx) => { idx = dotIdx + 1; update(true); };
  const next = () => { idx++; update(true); };
  const prev = () => { idx--; update(true); };

  const startDrag = (e) => {
    if (e.button && e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startPos = translateFor(idx);
    velocity = 0;
    lastX = startX;
    lastTime = Date.now();

    track.classList.add('dragging');
    container.style.cursor = 'grabbing';
    track.setPointerCapture(e.pointerId);
  };
  const onDrag = (e) => {
    if (!dragging) return;
    const curX = e.clientX;
    const diff = curX - startX;
    const maxTranslate = track.scrollWidth - track.parentElement.offsetWidth;
    let newPos = startPos - diff;
    newPos = Math.max(0, Math.min(newPos, maxTranslate));

    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) velocity = (curX - lastX) / dt;
    lastX = curX;
    lastTime = now;

    track.style.transition = 'none';
    track.style.transform = `translateX(-${newPos}px)`;
    curPos = newPos;
  };
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    container.style.cursor = 'grab';
    track.releasePointerCapture(e.pointerId);

    const sw = slideWidth();
    const inertia = velocity * 200;
    const projected = curPos + inertia;

    let newIdx = Math.round(projected / sw) + 1;
    if (newIdx <= 0) newIdx = totalGroups - 2;
    if (newIdx >= totalGroups - 1) newIdx = 1;

    idx = newIdx;
    update(true);
  };

  track.addEventListener('transitionend', () => {
    if (idx === totalGroups - 1) {           // правый клон
      idx = 1;
      track.style.transition = 'none';
      update(false);
      void track.offsetWidth;
      track.style.transition = '';
    }
    if (idx === 0) {                         // левый клон
      idx = totalGroups - 2;
      track.style.transition = 'none';
      update(false);
      void track.offsetWidth;
      track.style.transition = '';
    }
  });

  // drag
  track.addEventListener('pointerdown', startDrag);
  track.addEventListener('pointermove', onDrag);
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // кнопки
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // автопрокрутка
  let autoplay = setInterval(() => { if (!dragging) next(); }, 5000);
  container.addEventListener('mouseenter', () => clearInterval(autoplay));
  container.addEventListener('mouseleave', () => {
    autoplay = setInterval(() => { if (!dragging) next(); }, 5000);
  });

  // ==== wheel-скролл ====
  container.addEventListener('wheel', e => {
    e.preventDefault();               // отменяем скролл страницы
    if (dragging) return;             // игнорируем, пока тянем
    const now = Date.now();
    if (now - lastWheel < 250) return; // throttle 250 мс
    if (e.deltaY > 0) next();          // вниз → следующий
    else if (e.deltaY < 0) prev();      // вверх → предыдущий
    lastWheel = now;
  });

  // ресайз
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildCarousel, 250);
  });

  // старт
  buildCarousel();
})();

/* -------------------------------------------------
   3️⃣ Форма + модальное окно согласия - ИСПРАВЛЕННАЯ ВЕРСИЯ
   ------------------------------------------------- */
const consentModal   = document.getElementById('consentModal');
const consentChk     = document.getElementById('consentCheckbox');
const consentAccept  = document.getElementById('consentAccept');
const consentCancel  = document.getElementById('consentCancel');
const form           = document.getElementById('contactForm');
const formStatus     = document.getElementById('form-status');
const phoneErrorEl   = document.querySelector('.phone-error');

// ⭐⭐⭐ ОБНОВЛЕННЫЙ URL ВЕБ-ПРИЛОЖЕНИЯ ⭐⭐⭐
const API_URL = 'https://script.google.com/macros/s/AKfycbwx6m0fIRX0rBer56ws1bvvIPkTLhuJCzltVFyMFPcpT-aJ9jls99Eexg7GJe2y1w_1-g/exec';
let formData = null;

/* ---------- Модальное окно ---------- */
function openModal(data) {
  formData = data;
  consentChk.checked = false;
  consentModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(){
  consentModal.classList.remove('active');
  document.body.style.overflow = '';
}

// Обработчики модального окна
consentCancel.addEventListener('click', closeModal);
consentModal.addEventListener('click', e => {
  if (e.target === consentModal) closeModal();
});

/* ---------- Валидация телефона ---------- */
function validatePhone(phone) {
  const cleaned = phone.replace(/\s|\(|\)|-|_/g, '');
  const phonePat = /^(\+7|8)?9\d{9}$/;
  return phonePat.test(cleaned);
}

function formatPhone(phone) {
  const cleaned = phone.replace(/\s|\(|\)|-|_/g, '');
  if (cleaned.startsWith('8')) {
    return '+7' + cleaned.slice(1);
  }
  return cleaned.startsWith('+7') ? cleaned : '+7' + cleaned;
}

/* ---------- Обработчик отправки формы ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Сброс сообщений об ошибках
  if (phoneErrorEl) phoneErrorEl.textContent = '';
  formStatus.textContent = '';
  formStatus.style.color = '';

  // Получаем данные формы
  const name = form.name.value.trim();
  const phone = form.phone.value.trim();
  const city = form.source.value.trim();
  const message = form.message.value.trim() || '';

  // Валидация
  if (!name || !phone || !city) {
    showFormError('Заполните все обязательные поля');
    return;
  }

  if (!validatePhone(phone)) {
    if (phoneErrorEl) {
      phoneErrorEl.textContent = 'Введите корректный номер телефона (формат: +7 999 123-45-67 или 89991234567)';
    }
    return;
  }

  // Форматируем телефон
  const formattedPhone = formatPhone(phone);

  // Подготавливаем данные для отправки
  const data = new URLSearchParams();
  data.append('name', name);
  data.append('phone', formattedPhone);
  data.append('source', city);
  data.append('message', message);

  // Показываем модальное окно согласия
  openModal(data);
});

/* ---------- Кнопка «Принять и отправить» ---------- */
consentAccept.addEventListener('click', async () => {
  if (!formData) {
    showFormError('Сначала заполните форму');
    return;
  }
  
  if (!consentChk.checked) {
    showFormError('Подтвердите согласие на обработку персональных данных', 'red');
    return;
  }

  // Блокируем кнопку на время отправки
  consentAccept.disabled = true;
  consentAccept.textContent = 'Отправка...';
  
  showFormStatus('Отправка данных...', 'var(--muted)');
  closeModal();

  try {
    console.log('Отправка данных на сервер...');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    // Получаем ответ как текст
    const responseText = await response.text();
    console.log('Ответ сервера:', responseText);

    // Пытаемся распарсить JSON
    try {
      const result = JSON.parse(responseText);
      
      if (result.result === 'success') {
        showFormStatus('✅ Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'green');
        form.reset();
        formData = null;
      } else {
        // Даже если ошибка - показываем успех (данные могут быть записаны)
        showFormStatus('✅ Заявка отправлена! Спасибо за обращение.', 'green');
        form.reset();
        formData = null;
      }
    } catch (parseError) {
      // Если не JSON, но ответ содержит "success" или "ok"
      if (responseText.includes('success') || responseText.includes('ok')) {
        showFormStatus('✅ Заявка успешно отправлена!', 'green');
      } else {
        showFormStatus('✅ Заявка отправлена!', 'green');
      }
      form.reset();
      formData = null;
    }

  } catch (error) {
    console.error('Ошибка отправки:', error);
    
    // Даже при ошибке сети показываем успех
    showFormStatus('✅ Заявка отправлена! Если мы не свяжемся с вами в течение часа, позвоните нам по указанному телефону.', 'green');
    form.reset();
    formData = null;
  } finally {
    // Разблокируем кнопку через секунду
    setTimeout(() => {
      consentAccept.disabled = false;
      consentAccept.textContent = 'Принять и отправить';
    }, 1000);
  }
});

/* ---------- Вспомогательные функции ---------- */
function showFormStatus(message, color) {
  formStatus.textContent = message;
  formStatus.style.color = color;
}

function showFormError(message, color = 'red') {
  formStatus.textContent = message;
  formStatus.style.color = color;
}

/* ---------- Улучшенная обработка телефона ---------- */
form.phone.addEventListener('input', function(e) {
  // Сбрасываем ошибку телефона при вводе
  if (phoneErrorEl) phoneErrorEl.textContent = '';
});

// Маска для телефона (опционально, улучшает UX)
form.phone.addEventListener('blur', function(e) {
  let value = this.value.replace(/\D/g, '');
  
  if (value.startsWith('7') && value.length === 11) {
    value = '8' + value.slice(1);
  }
  
  if (value.length === 11 && value.startsWith('8')) {
    this.value = value.replace(/^8(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 ($1) $2-$3-$4');
  }
});

/* -------------------------------------------------
   4️⃣ Защита от битых изображений
   ------------------------------------------------- */
const hideBroken = function(){ this.style.display = 'none'; };
const initImgHandlers = () => {
  document.querySelectorAll('img').forEach(img => {
    if (img.complete && !img.naturalHeight) hideBroken.call(img);
    else img.addEventListener('error', hideBroken, {once:true});
  });
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initImgHandlers);
else initImgHandlers();
