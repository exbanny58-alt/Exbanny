// Открытие настроек
function openSettings() {
    document.getElementById('settingsPage').style.display = 'flex';
    loadSettings();
}

function closeSettings() {
    document.getElementById('settingsPage').style.display = 'none';
}

// Случайные цвета для иконок при наведении
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item a');
    
    const colors = [
        '#FF6B6B', '#FF4757', '#FF8A5C', '#FF6348', '#FF9F43',
        '#FECA57', '#FFD93D', '#00B894', '#00CEC9', '#55EFC4',
        '#0984E3', '#45B7D1', '#74B9FF', '#6C5CE7', '#A29BFE',
        '#7BED9F', '#70A1FF', '#FFAF40', '#FF4D4D', '#D980FA'
    ];
    
    let lastColor = null;
    let lastColor2 = null;
    
    function getRandomColor() {
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    function getUniqueRandomColor() {
        let newColor;
        let attempts = 0;
        do {
            newColor = getRandomColor();
            attempts++;
            if (attempts > 50) break;
        } while (newColor === lastColor || newColor === lastColor2);
        
        lastColor2 = lastColor;
        lastColor = newColor;
        return newColor;
    }
    
    navItems.forEach(item => {
        const icon = item.querySelector('.nav-icon');
        const text = item.querySelector('.nav-text');
        
        item.addEventListener('mouseenter', function() {
            const color = getUniqueRandomColor();
            if (icon) {
                icon.style.color = color;
                icon.style.transition = 'color 0.3s ease, transform 0.3s ease';
            }
            if (text) {
                text.style.color = color;
                text.style.transition = 'color 0.3s ease';
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (icon) {
                icon.style.color = '';
            }
            if (text) {
                text.style.color = '';
            }
        });
    });
});