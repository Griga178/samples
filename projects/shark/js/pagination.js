
const sections = document.querySelectorAll('.scroll-section');
let currentSection = 0;
const circles = document.querySelectorAll('.indicator-circle');

function smoothScrollTo(target) {
    const targetPosition = target.getBoundingClientRect().top + window.scrollY;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const scrollSpeed = easeInOut(timeElapsed, startPosition, distance, 700); // 700 - длительность анимации
        window.scrollTo(0, scrollSpeed);
        if (timeElapsed < 700) requestAnimationFrame(animation);
    }

    function easeInOut(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
}

function updateIndicator() {
    circles.forEach((circle, index) => {
        if (index === currentSection) {
            circle.classList.add('active');
        } else {
            circle.classList.remove('active');
        }
    });
}
circles.forEach((circle, index) => {
    circle.addEventListener('click', () => {
        currentSection = index;
        smoothScrollTo(sections[currentSection]);
        updateIndicator();
    });
});
window.addEventListener('wheel', (event) => {
    event.preventDefault();
    if (event.deltaY > 0 && currentSection < sections.length - 1) {
        currentSection++;
    } else if (event.deltaY < 0 && currentSection > 0) {
        currentSection--;
    }
    smoothScrollTo(sections[currentSection]);
    updateIndicator();
}, { passive: false }); // Добавляем опцию passive: false

let timeout;

window.addEventListener('scroll', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const scrollPosition = window.scrollY;
        sections.forEach((section, index) => {
            if (scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.clientHeight) {
                currentSection = index;
                updateIndicator();
            }
        });
    }, 100); // 100 миллисекунд задержки
});
