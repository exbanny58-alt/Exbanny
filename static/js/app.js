class SpaApp {
    constructor() {
        this.currentPage = 'server';
        this.container = document.getElementById('page-content');
        this.contentDiv = document.querySelector('.content');
        this.navLinks = document.querySelectorAll('.nav-links a');
        this.pagesData = null;
        this.init();
    }

    async init() {
        // Загружаем страницы из JSON
        try {
            const response = await fetch('/static/data/pages.json');
            this.pagesData = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки страниц:', error);
            this.showError('Не удалось загрузить данные');
            return;
        }

        // Настройка навигации
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });

            link.addEventListener('mouseenter', () => {
                if (!link.classList.contains('active')) {
                    link.style.color = '#ffffff';
                    link.style.borderBottomColor = '#666';
                }
            });

            link.addEventListener('mouseleave', () => {
                if (!link.classList.contains('active')) {
                    link.style.color = '';
                    link.style.borderBottomColor = '';
                }
            });
        });

        // Обработка кнопки "Назад"
        window.addEventListener('popstate', (event) => {
            const page = event.state?.page || 'server';
            this.loadPage(page, false);
        });

        // Загрузка начальной страницы
        const initialPage = window.location.hash.replace('#', '') || 'server';
        this.navigateTo(initialPage, false);

        // Клик вне меню
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-links')) {
                this.navLinks.forEach(link => {
                    if (!link.classList.contains('active')) {
                        link.style.color = '';
                        link.style.borderBottomColor = '';
                    }
                });
            }
        });
    }

    navigateTo(page, addToHistory = true) {
        if (page === this.currentPage) return;
        this.currentPage = page;
        this.setActiveLink(page);
        this.loadPage(page, addToHistory);
    }

    setActiveLink(page) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            link.style.color = '';
            link.style.borderBottomColor = '';
        });

        const activeLink = document.querySelector(`.nav-links a[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    loadPage(page, addToHistory = true) {
        if (!this.pagesData || !this.pagesData.pages) {
            this.showError('Данные не загружены');
            return;
        }

        const pageData = this.pagesData.pages[page];
        
        if (!pageData) {
            this.showError('Страница не найдена');
            return;
        }

        // Обновляем контент
        this.container.innerHTML = pageData.template;
        document.title = `SPA - ${pageData.title}`;
        
        // Обновляем URL
        if (addToHistory && history.pushState) {
            history.pushState({ page: page }, pageData.title, `#${page}`);
        }

        // Анимация
        this.contentDiv.classList.remove('fade-in');
        setTimeout(() => {
            this.contentDiv.classList.add('fade-in');
        }, 10);
    }

    showError(message) {
        this.container.innerHTML = `
            <div style="color: #ff6b6b;">
                <h1>❌ Ошибка</h1>
                <p>${message}</p>
                <p class="sub">Попробуйте обновить страницу</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SpaApp();
});