document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const modalContent = modal.querySelector('.modal-content');
  const closeBtn = modal.querySelector('.modal-close');

  // Функция закрытия модального окна
  function closeModal() {
    modal.style.display = 'none';
  }

  // Закрытие по клику на крестик
  closeBtn.addEventListener('click', closeModal);

  // Закрытие по клику на оверлей (но не на сам контейнер)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Обработка кликов по карточкам проектов
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    card.addEventListener('click', () => {
      // Здесь можно сгенерировать динамический контент
      // Например, взять данные из data-атрибутов или из скрытого блока
      const title = card.querySelector('h3')?.innerText || 'Проект';
      const description = card.querySelector('p')?.innerHTML || 'Подробное описание...';

      // Заполняем модальное окно
      modalContent.innerHTML = `
        <h2>${title}</h2>
        ${description}
        <!-- Добавьте сюда картинки, если они есть -->
        <img src="path/to/image.jpg" alt="скриншот" style="max-width:100%; margin-top:15px;">
      `;

      modal.style.display = 'flex';
    });
  });
});
