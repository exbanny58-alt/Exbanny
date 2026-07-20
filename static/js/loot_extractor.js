// ============================================
// MPG LOOT EXTRACTOR - С ИСПОЛЬЗОВАНИЕМ ИЕРАРХИИ
// ============================================

// ============================================
// СОСТОЯНИЕ
// ============================================

let lootState = {
    data: {},
    filtered: [],
    searchTerm: '',
    currentCategory: 'all',
    isLoading: false,
    profilesPath: '',
    hierarchyData: {}
};

// КАТЕГОРИИ
const CATEGORIES = {
    all: 'Все предметы',
    weapons: 'Оружие',
    magazines: 'Магазины',
    ammo: 'Патроны',
    attachments: 'Обвесы',
    clothing: 'Одежда',
    vests: 'Бронежилеты',
    bags: 'Рюкзаки',
    food: 'Еда',
    drinks: 'Напитки',
    medical: 'Медицина',
    tools: 'Инструменты',
    materials: 'Материалы',
    animals: 'Животные',
    zombies: 'Зомби',
    vehicles: 'Транспорт',
    vehicle_parts: 'Детали транспорта',
    boats: 'Лодки',
    books: 'Книги',
    fish: 'Рыба',
    other: 'Разное'
};

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

function initLootExtractor() {
    console.log('📦 Инициализация MPG Loot Extractor');
    
    const container = document.getElementById('editorContentArea');
    if (!container) {
        console.warn('⚠️ editorContentArea не найден');
        return;
    }
    
    loadProfilesPath().then(() => {
        loadHierarchy().then(() => {
            loadLootData().then(() => {
                renderLootExtractor(container);
            });
        });
    });
}

// ============================================
// ЗАГРУЗКА ПУТИ К PROFILES
// ============================================

async function loadProfilesPath() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        if (settings.server_exe) {
            const serverDir = settings.server_exe.replace(/\\/g, '/').replace(/\/[^/]*$/, '');
            lootState.profilesPath = serverDir + '/profiles';
            console.log(`📁 Путь к profiles: ${lootState.profilesPath}`);
        }
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить путь к серверу:', e);
    }
}

// ============================================
// ЗАГРУЗКА ИЕРАРХИИ
// ============================================

async function loadHierarchy() {
    try {
        const hierarchyPath = lootState.profilesPath + '/MPG_LootExtractor/LootWithParents.json';
        console.log(`📂 Загрузка иерархии: ${hierarchyPath}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: hierarchyPath })
        });
        
        const result = await response.json();
        
        if (result.success && result.content) {
            lootState.hierarchyData = JSON.parse(result.content);
            console.log(`📚 Загружена иерархия для ${Object.keys(lootState.hierarchyData).length} предметов`);
            return true;
        } else {
            console.warn('⚠️ LootWithParents.json не найден');
            return false;
        }
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить иерархию:', e);
        return false;
    }
}

// ============================================
// ОПРЕДЕЛЕНИЕ КАТЕГОРИИ ПО ИЕРАРХИИ
// ============================================

function detectCategoryByHierarchy(key) {
    const entry = lootState.hierarchyData[key];
    if (!entry || !entry.hierarchy) return null;
    
    const hierarchy = entry.hierarchy;
    
    // ============================================
    // 1. ДЕТАЛИ ТРАНСПОРТА (CarWheel, CarDoor)
    // ============================================
    if (hierarchy.includes('CarWheel') || hierarchy.includes('CarDoor')) {
        return 'vehicle_parts';
    }
    
    // ============================================
    // 2. ТРАНСПОРТ (целые автомобили)
    // ============================================
    if (hierarchy.includes('Transport') || hierarchy.includes('Car') || 
        hierarchy.includes('Truck') || hierarchy.includes('CarScript')) {
        return 'vehicles';
    }
    
    // ============================================
    // 3. ЛОДКИ
    // ============================================
    if (hierarchy.includes('Boat') || hierarchy.includes('BoatScript')) {
        return 'boats';
    }
    
    // ============================================
    // 4. КНИГИ
    // ============================================
    if (hierarchy.includes('Book_Base') || hierarchy.includes('ItemBook')) {
        return 'books';
    }
    
    // ============================================
    // 5. ОРУЖИЕ
    // ============================================
    if (hierarchy.includes('Weapon_Base') || hierarchy.includes('RifleCore') || 
        hierarchy.includes('PistolCore') || hierarchy.includes('Archery_Base')) {
        return 'weapons';
    }
    
    // ============================================
    // 6. МАГАЗИНЫ
    // ============================================
    if (hierarchy.includes('Magazine_Base') || hierarchy.includes('DefaultMagazine')) {
        return 'magazines';
    }
    
    // ============================================
    // 7. ПАТРОНЫ
    // ============================================
    if (hierarchy.includes('Ammunition_Base')) {
        return 'ammo';
    }
    
    // ============================================
    // 8. ОБВЕСЫ
    // ============================================
    if (hierarchy.includes('ItemOptics') || hierarchy.includes('ItemOptics_Base') || 
        hierarchy.includes('ItemSuppressor')) {
        return 'attachments';
    }
    
    // ============================================
    // 9. ОДЕЖДА (с подкатегориями)
    // ============================================
    if (hierarchy.includes('Clothing') || hierarchy.includes('Clothing_Base')) {
        // Бронежилеты
        if (hierarchy.some(p => p.includes('PlateCarrier') || p.includes('PressVest') || 
            p.includes('HighCapacityVest') || p.includes('UKAssVest') || 
            p.includes('SmershVest') || p.includes('ReflexVest') || 
            p.includes('PoliceVest') || p.includes('TacticalVest'))) {
            return 'vests';
        }
        // Рюкзаки
        if (hierarchy.some(p => p.includes('Bag') || p.includes('Backpack') || p.includes('Pack'))) {
            return 'bags';
        }
        return 'clothing';
    }
    
    // ============================================
    // 10. ЖИВОТНЫЕ
    // ============================================
    if (hierarchy.includes('AnimalBase')) {
        return 'animals';
    }
    
    // ============================================
    // 11. ЗОМБИ
    // ============================================
    if (hierarchy.includes('ZombieBase') || hierarchy.includes('DayZInfected')) {
        return 'zombies';
    }
    
    // ============================================
    // 12. ЕДА / НАПИТКИ / РЫБА
    // ============================================
    if (hierarchy.includes('Edible_Base')) {
        const keyLower = key.toLowerCase();
        const fishKeywords = ['carp', 'mackerel', 'trout', 'pollock', 'bitterlings', 'shrimp', 'fish'];
        for (const f of fishKeywords) {
            if (keyLower.includes(f)) {
                return 'fish';
            }
        }
        if (hierarchy.includes('Bottle_Base') || hierarchy.includes('SodaCan')) {
            return 'drinks';
        }
        return 'food';
    }
    
    // ============================================
    // 13. МЕДИЦИНА
    // ============================================
    const medicalKeywords = ['Bandage', 'Blood', 'Morphine', 'Epinephrine', 'Saline', 
                             'Antibiotics', 'Vitamins', 'Painkiller', 'Iodine', 'Charcoal',
                             'Tetracycline', 'Defibrillator', 'Splint', 'Syringe', 'FirstAid',
                             'Thermometer', 'Disinfectant', 'Purification', 'Injector'];
    for (const m of medicalKeywords) {
        if (key.includes(m)) {
            return 'medical';
        }
    }
    
    // ============================================
    // 14. ИНСТРУМЕНТЫ (по иерархии)
    // ============================================
    if (hierarchy.some(p => p.includes('Tool') || p.includes('Item'))) {
        const toolKeywords = ['Knife', 'Axe', 'Saw', 'Hammer', 'Wrench', 'Screwdriver',
            'Pliers', 'Shovel', 'Pickaxe', 'Crowbar', 'Hacksaw', 'Hatchet', 'Machete',
            'Sickle', 'Sword', 'Spear', 'Mace', 'Trap', 'Lockpick', 'Compass', 'Map',
            'Radio', 'Flashlight', 'Lighter', 'Matches', 'Rope', 'DuctTape', 'Sewing'];
        for (const t of toolKeywords) {
            if (key.includes(t)) {
                return 'tools';
            }
        }
    }
    
    return null;
}

// ============================================
// ОПРЕДЕЛЕНИЕ КАТЕГОРИИ (FALLBACK) - ИСПРАВЛЕННАЯ
// ============================================

function detectCategoryFallback(key, name) {
    const k = key.toLowerCase();
    const n = name.toLowerCase();
    
    // ============================================
    // ТЕСТОВЫЕ/СЛУЖЕБНЫЕ (ПЕРВЫМИ!)
    // ============================================
    if (k.includes('test') || k.includes('debug') || k.includes('dummy') || 
        k === 'doortestcamera' || k.includes('staticobj') || k.includes('anniversary') ||
        k.includes('spookyarea') || k.includes('contaminatedarea')) {
        return 'other';
    }
    
    // ============================================
    // ДЕТАЛИ ТРАНСПОРТА - ТОЛЬКО ТОЧНЫЕ СОВПАДЕНИЯ!
    // ============================================
    
    // 1. КОЛЁСА (только если есть признак авто)
    if (k.includes('wheel') && !k.includes('bike') && !k.includes('steering') && 
        !k.includes('water') && !k.includes('ship') &&
        (k.includes('civ') || k.includes('offroad') || k.includes('truck') || 
         k.includes('hatchback') || k.includes('sedan') || k.includes('wheel_'))) {
        return 'vehicle_parts';
    }
    
    // 2. ДВЕРИ (только если есть признак авто, исключаем DoorTestCamera)
    if (k.includes('door') && !k.includes('test') && !k.includes('camera') &&
        (k.includes('civ') || k.includes('sedan') || k.includes('offroad') || 
         k.includes('hatchback') || k.includes('truck') || k.includes('door_'))) {
        return 'vehicle_parts';
    }
    
    // 3. КАПОТ (только если есть признак авто, исключаем одежду)
    if (k.includes('hood') && !k.includes('hoodie') && !k.includes('hooded') &&
        (k.includes('civ') || k.includes('sedan') || k.includes('offroad') || 
         k.includes('hatchback') || k.includes('truck'))) {
        return 'vehicle_parts';
    }
    
    // 4. БАГАЖНИК (только если есть признак авто)
    if (k.includes('trunk') && (k.includes('civ') || k.includes('sedan') || 
        k.includes('offroad') || k.includes('hatchback') || k.includes('truck'))) {
        return 'vehicle_parts';
    }
    
    // 5. АВТОМОБИЛЬНЫЙ АККУМУЛЯТОР (CarBattery, а не Battery9V)
    if (k.includes('carbattery') || k.includes('car_battery')) {
        return 'vehicle_parts';
    }
    
    // 6. АВТОМОБИЛЬНЫЙ РАДИАТОР
    if (k.includes('carradiator') || (k.includes('radiator') && 
        (k.includes('car') || k.includes('vehicle') || k.includes('truck')))) {
        return 'vehicle_parts';
    }
    
    // 7. СВЕЧА НАКАЛИВАНИЯ (GlowPlug - это деталь авто)
    if (k === 'glowplug' || (k.includes('glow') && k.includes('plug') && !k.includes('spark'))) {
        return 'vehicle_parts';
    }
    
    // 8. ТОРМОЗНАЯ ЖИДКОСТЬ
    if (k.includes('brakefluid') || k.includes('brake_fluid')) {
        return 'vehicle_parts';
    }
    
    // 9. СВЕЧА ЗАЖИГАНИЯ (SparkPlug - это деталь авто)
    if (k === 'sparkplug' || (k.includes('spark') && k.includes('plug'))) {
        return 'vehicle_parts';
    }
    
    // 10. АВТОМОБИЛЬНАЯ ЛАМПА (HeadlightH7)
    if (k.includes('headlight') || (k.includes('head') && k.includes('light') && 
        (k.includes('h7') || k.includes('auto') || k.includes('car')))) {
        return 'vehicle_parts';
    }
    
    // 11. МОТОРНОЕ МАСЛО (EngineOil)
    if (k.includes('engineoil') || k.includes('engine_oil')) {
        return 'vehicle_parts';
    }
    
    // ============================================
    // БАТАРЕЙКИ (НЕ детали транспорта!)
    // ============================================
    if (k.includes('battery') && !k.includes('car') && !k.includes('truck')) {
        if (k.includes('9v') || k.includes('charger') || k.includes('aaa') || k.includes('aa') ||
            k.includes('rechargeable')) {
            return 'tools';
        }
    }
    
    // ============================================
    // ЗАРЯДНОЕ УСТРОЙСТВО (НЕ деталь транспорта!)
    // ============================================
    if (k.includes('charger') && !k.includes('car') && !k.includes('battery')) {
        return 'tools';
    }
    
    // ============================================
    // КОСТЁР (НЕ деталь транспорта!)
    // ============================================
    if (k.includes('fireplace') || k.includes('bonfire') || k.includes('fire_') ||
        k.includes('firepit') || k.includes('campfire')) {
        return 'tools';
    }
    
    // ============================================
    // ОРУЖИЕ
    // ============================================
    const weaponKeywords = ['ak', 'm4', 'mosin', 'svd', 'vss', 'mp5', 'glock', 'colt',
        'revolver', 'magnum', 'deagle', 'shotgun', 'rifle', 'carbine', 'pistol', 'smg',
        'aug', 'fal', 'famas', 'fnx', 'lar', 'lemas', 'm16', 'mkii', 'rak', 'sks',
        'saiga', 'scout', 'pioneer', 'blaze', 'winchester', 'crossbow', 'longhorn',
        'trumpet', 'sporter', 'b95', 'cz', 'mp133', 'izh', 'bizon', 'vikhr'];
    for (const w of weaponKeywords) {
        if (k === w || k.startsWith(w + '_') || k.startsWith(w + '-')) {
            return 'weapons';
        }
    }
    
    // ============================================
    // МАГАЗИНЫ
    // ============================================
    if (k.startsWith('mag_') || k.includes('_mag_') || 
        (k.includes('mag') && (k.includes('rnd') || k.includes('round') || k.includes('cyl')))) {
        if (!k.includes('azine')) return 'magazines';
    }
    
    // ============================================
    // ПАТРОНЫ
    // ============================================
    if (k.startsWith('ammo_') || k.includes('_ammo') || k.includes('cartridge') || 
        k.includes('bullet') || (k.includes('box') && k.includes('rnd'))) {
        return 'ammo';
    }
    
    // ============================================
    // ОБВЕСЫ
    // ============================================
    const attachKeywords = ['optic', 'scope', 'sight', 'suppressor', 'silencer', 'muzzle', 
        'bttstck', 'stock', 'buttstock', 'hndgrd', 'handguard', 'rail', 'bayonet', 
        'compensator', 'flash', 'grip', 'bipod', 'laser', 'kobra', 'pso', 'acog',
        'holo', 'reflex', 'starlight', 'tlr', 'nvg'];
    for (const a of attachKeywords) {
        if (k.includes(a)) return 'attachments';
    }
    
    // ============================================
    // ОДЕЖДА
    // ============================================
    if (k.includes('ghillie')) return 'clothing';
    
    const clothingKeywords = ['jacket', 'pants', 'shirt', 'tshirt', 'sweater', 'hoodie', 'coat',
        'hat', 'cap', 'helmet', 'mask', 'goggles', 'glasses', 'boots', 'shoes', 'sneakers', 
        'gloves', 'suit', 'dress', 'skirt', 'uniform', 'bdu', 'raincoat', 'parka', 'anorak',
        'balaclava', 'shemag', 'bandana', 'hood', 'beanie', 'vest'];
    for (const c of clothingKeywords) {
        if (k.includes(c)) {
            // Бронежилеты
            if (k.includes('platecarrier') || k.includes('pressvest') || 
                k.includes('tacticalvest') || k.includes('highcapacity') || 
                k.includes('ukass') || k.includes('smersh') || k.includes('reflex') ||
                k.includes('policevest') || k.includes('stabvest')) {
                return 'vests';
            }
            // Рюкзаки
            if (k.includes('bag') || k.includes('backpack') || k.includes('pack') ||
                k.includes('pouch') || k.includes('sack') || k.includes('rucksack')) {
                return 'bags';
            }
            return 'clothing';
        }
    }
    
    // ============================================
    // БРОНЕЖИЛЕТЫ (доп. проверка)
    // ============================================
    if (k.includes('platecarrier') || k.includes('pressvest') || k.includes('tacticalvest') ||
        k.includes('highcapacityvest') || k.includes('ukassvest') || k.includes('smershvest') ||
        k.includes('reflexvest') || k.includes('stabvest')) {
        return 'vests';
    }
    
    // ============================================
    // РЮКЗАКИ
    // ============================================
    if (k.includes('bag') || k.includes('backpack') || k.includes('pack') || 
        k.includes('pouch') || k.includes('sack') || k.includes('coyote') ||
        k.includes('taloon') || k.includes('tortilla') || k.includes('drybag') ||
        k.includes('duffel') || k.includes('assault') || k.includes('alice') ||
        k.includes('mountain') || k.includes('hiking') || k.includes('rucksack')) {
        return 'bags';
    }
    
    // ============================================
    // ЕДА
    // ============================================
    const foodKeywords = ['can', 'mushroom', 'meat', 'steak', 'fillet', 'pate', 'bacon',
        'cereal', 'chips', 'crackers', 'rice', 'pasta', 'honey', 'jam', 'marmalade',
        'apple', 'pear', 'plum', 'tomato', 'potato', 'pumpkin', 'zucchini', 'pepper',
        'bread', 'cake', 'cookie', 'chocolate', 'candy', 'beef', 'pork', 'chicken',
        'boar', 'rabbit', 'deer', 'goat', 'sheep', 'pig', 'cow', 'wolf', 'fox', 'bear',
        'milk', 'cheese', 'butter', 'egg', 'noodle', 'spaghetti', 'tuna', 'sardine'];
    for (const f of foodKeywords) {
        if (k.includes(f)) return 'food';
    }
    
    // ============================================
    // НАПИТКИ
    // ============================================
    if (k.includes('water') || k.includes('soda') || k.includes('kvass') ||
        k.includes('cola') || k.includes('lemonade') || k.includes('milk') ||
        k.includes('canteen') || k.includes('bottle') || k.includes('drink') ||
        k.includes('juice') || k.includes('tea') || k.includes('coffee') ||
        k.includes('spite') || k.includes('pipsi') || k.includes('fronta') ||
        k.includes('beer') || k.includes('wine') || k.includes('vodka')) {
        return 'drinks';
    }
    
    // ============================================
    // МЕДИЦИНА
    // ============================================
    const medKeywords = ['bandage', 'blood', 'morphine', 'epinephrine', 'adrenaline',
        'saline', 'antibiotics', 'vitamins', 'painkiller', 'iodine', 'charcoal',
        'tetracycline', 'defibrillator', 'splint', 'syringe', 'firstaid', 'thermometer',
        'disinfectant', 'purification', 'injection', 'gauze', 'plaster', 'antiseptic',
        'tablet', 'pill', 'capsule', 'hemostatic'];
    for (const m of medKeywords) {
        if (k.includes(m)) return 'medical';
    }
    
    // ============================================
    // ИНСТРУМЕНТЫ
    // ============================================
    const toolKeywords = ['knife', 'axe', 'saw', 'hammer', 'wrench', 'screwdriver',
        'pliers', 'shovel', 'pickaxe', 'crowbar', 'hacksaw', 'hatchet', 'machete',
        'sickle', 'sword', 'spear', 'mace', 'trap', 'lockpick', 'compass', 'map',
        'radio', 'flashlight', 'lighter', 'matches', 'rope', 'ducttape', 'sewing',
        'leather', 'whetstone', 'lug', 'pipe', 'broom', 'hoe', 'rake', 'shovel',
        'hammer', 'wrench', 'screwdriver', 'pliers', 'crowbar', 'hacksaw', 'hatchet'];
    for (const t of toolKeywords) {
        if (k.includes(t)) return 'tools';
    }
    
    // ============================================
    // МАТЕРИАЛЫ
    // ============================================
    const matKeywords = ['wood', 'stone', 'metal', 'steel', 'iron', 'burlap', 'leather', 
        'fabric', 'netting', 'feather', 'pelt', 'hide', 'skin', 'gut', 'fur', 'wool',
        'bone', 'nail', 'wire', 'plank', 'log', 'bark', 'lime', 'epoxy', 'plastic',
        'tanned', 'strip', 'cloth', 'canvas'];
    for (const m of matKeywords) {
        if (k.includes(m)) return 'materials';
    }
    
    // ============================================
    // ЖИВОТНЫЕ
    // ============================================
    if (k.startsWith('animal_') || k.includes('_animal') || 
        k.startsWith('dead') && (k.includes('chicken') || k.includes('rabbit') || 
        k.includes('fox') || k.includes('rooster'))) {
        return 'animals';
    }
    
    // ============================================
    // ЗОМБИ
    // ============================================
    if (k.startsWith('zmb') || k.includes('_zmb') || k.includes('zombie') || 
        k.includes('infected') || k.includes('undead')) {
        return 'zombies';
    }
    
    // ============================================
    // КНИГИ
    // ============================================
    if (k.startsWith('book') || k.includes('_book')) {
        if (!k.includes('backpack') && !k.includes('bag') && !k.includes('case')) {
            return 'books';
        }
    }
    
    // ============================================
    // РЫБА
    // ============================================
    const fishKeywords = ['carp', 'mackerel', 'trout', 'pollock', 'bitterlings', 'shrimp',
        'fish', 'fillets', 'walleye', 'steelhead'];
    for (const f of fishKeywords) {
        if (k.includes(f)) return 'fish';
    }
    
    // ============================================
    // ФЛАГИ
    // ============================================
    if (k.startsWith('flag_') || k.includes('_flag')) {
        return 'other';
    }
    
    // ============================================
    // ПО УМОЛЧАНИЮ
    // ============================================
    return 'other';
}

// ============================================
// ОПРЕДЕЛЕНИЕ КАТЕГОРИИ (ОСНОВНАЯ)
// ============================================

function detectCategory(key, name) {
    const hierarchyCategory = detectCategoryByHierarchy(key);
    if (hierarchyCategory) {
        return hierarchyCategory;
    }
    return detectCategoryFallback(key, name);
}

// ============================================
// ЗАГРУЗКА ДАННЫХ (Loot.json)
// ============================================

async function loadLootData() {
    lootState.isLoading = true;
    
    try {
        const lootPath = lootState.profilesPath + '/MPG_LootExtractor/Loot.json';
        console.log(`📂 Загрузка словаря: ${lootPath}`);
        
        const response = await fetch('/api/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: lootPath })
        });
        
        const result = await response.json();
        
        if (result.success && result.content) {
            const data = JSON.parse(result.content);
            
            const categorized = {};
            for (const [key, value] of Object.entries(data)) {
                categorized[key] = {
                    name: value,
                    category: detectCategory(key, value)
                };
            }
            lootState.data = categorized;
            lootState.filtered = Object.keys(categorized);
            
            console.log(`📚 Загружено ${Object.keys(categorized).length} предметов из Loot.json`);
        } else {
            console.warn('⚠️ Файл Loot.json не найден');
            if (typeof notifications !== 'undefined') {
                notifications.warning('Файл Loot.json не найден в папке MPG_LootExtractor');
            }
            lootState.data = {};
            lootState.filtered = [];
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки словаря:', e);
        if (typeof notifications !== 'undefined') {
            notifications.error('Ошибка загрузки Loot.json');
        }
        lootState.data = {};
        lootState.filtered = [];
    }
    
    lootState.isLoading = false;
}

// ============================================
// ПЛАВАЮЩАЯ КНОПКА "НАВЕРХ"
// ============================================

let scrollTopBtn = null;
let mainScrollContainer = null;
let isScrolling = false;

function createScrollTopButton() {
    // Удаляем старую
    const oldBtn = document.getElementById('scrollTopBtn');
    if (oldBtn) {
        oldBtn.remove();
        scrollTopBtn = null;
        mainScrollContainer = null;
    }
    
    // Создаём кнопку
    scrollTopBtn = document.createElement('button');
    scrollTopBtn.id = 'scrollTopBtn';
    scrollTopBtn.className = 'scroll-top-btn';
    scrollTopBtn.innerHTML = '↑';
    scrollTopBtn.title = 'Наверх';
    
    scrollTopBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (isScrolling) return;
        isScrolling = true;
        
        // Находим контейнер с прокруткой
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            const scrollContainer = contentArea.querySelector('div:first-child');
            if (scrollContainer && scrollContainer.scrollTop > 0) {
                // Плавная прокрутка с дополнительными параметрами
                scrollContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                
                // Снимаем блокировку после завершения анимации
                setTimeout(function() {
                    isScrolling = false;
                }, 800);
                return;
            }
        }
        
        // Если не нашли - скроллим окно
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        setTimeout(function() {
            isScrolling = false;
        }, 800);
    });
    
    document.body.appendChild(scrollTopBtn);
    console.log('✅ Кнопка "Наверх" создана');
    
    // Ищем основной контейнер с прокруткой
    setTimeout(function() {
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            const scrollContainer = contentArea.querySelector('div:first-child');
            if (scrollContainer) {
                mainScrollContainer = scrollContainer;
                mainScrollContainer.addEventListener('scroll', toggleScrollTopButton);
                setTimeout(toggleScrollTopButton, 300);
                console.log('📦 Найден контейнер для отслеживания скролла:', scrollContainer.className);
            }
        }
    }, 500);
}

function toggleScrollTopButton() {
    if (!scrollTopBtn || !mainScrollContainer) return;
    
    const scrollY = mainScrollContainer.scrollTop || 0;
    
    if (scrollY > 300) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
}

function destroyScrollTopButton() {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) {
        btn.remove();
        scrollTopBtn = null;
    }
    if (mainScrollContainer) {
        mainScrollContainer.removeEventListener('scroll', toggleScrollTopButton);
        mainScrollContainer = null;
    }
    isScrolling = false;
}
// ============================================
// ОТРИСОВКА
// ============================================

function renderLootExtractor(container) {
    const totalItems = Object.keys(lootState.data).length;
    const filteredItems = lootState.filtered.length;
    
    // Показываем только категории, в которых есть предметы
    const displayCategories = ['all'];
    for (const [key, name] of Object.entries(CATEGORIES)) {
        if (key === 'all') continue;
        const count = Object.values(lootState.data).filter(d => d.category === key).length;
        if (count > 0) {
            displayCategories.push(key);
        }
    }
    
    container.innerHTML = `
        <div class="loot-extractor">
            <!-- Плавающая кнопка "Назад" -->
            <button class="mpg-back-btn" onclick="lootBackToTiles()" title="Вернуться к выбору редакторов">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15,18 9,12 15,6"/>
                </svg>
                <span>Назад</span>
            </button>

            <!-- Заголовок -->
            <div class="loot-header">
                <div class="loot-header-info">
                    <span class="loot-header-icon">📦</span>
                    <div>
                        <h2 class="loot-header-title">MPG Loot Extractor</h2>
                        <p class="loot-header-subtitle">Справочник предметов из Loot.json</p>
                    </div>
                </div>
                <div class="loot-header-actions">
                    <span class="loot-total">${totalItems} предметов</span>
                </div>
            </div>

            <!-- Панель управления -->
            <div class="loot-toolbar">
                <div class="loot-search-wrapper">
                    <svg class="loot-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" class="loot-search" id="lootSearch" 
                           placeholder="Поиск по названию или классу..." 
                           oninput="filterLoot()">
                </div>
                <div class="loot-categories">
                    ${displayCategories.map(cat => {
                        const count = cat === 'all' ? totalItems : 
                            Object.values(lootState.data).filter(d => d.category === cat).length;
                        const label = CATEGORIES[cat] || cat;
                        const active = lootState.currentCategory === cat ? 'active' : '';
                        return `<button class="loot-cat-btn ${active}" data-cat="${cat}" onclick="filterLootByCategory('${cat}')">
                            ${label} (${count})
                        </button>`;
                    }).join('')}
                </div>
            </div>

            <!-- Статистика -->
            <div class="loot-stats" id="lootStats">
                <div class="loot-stat-item">
                    <span class="loot-stat-number">${filteredItems}</span>
                    <span class="loot-stat-label">Найдено</span>
                </div>
                <div class="loot-stat-item">
                    <span class="loot-stat-number">${lootState.currentCategory === 'all' ? totalItems : Object.values(lootState.data).filter(d => d.category === lootState.currentCategory).length}</span>
                    <span class="loot-stat-label">В категории</span>
                </div>
            </div>

            <!-- Список -->
            <div class="loot-list" id="lootList">
                ${renderLootItems()}
            </div>
        </div>
    `;
    
    updateCategoryButtons();
    
    // Создаём кнопку "Наверх"
    createScrollTopButton();
}

// ============================================
// ОТРИСОВКА СПИСКА ПРЕДМЕТОВ
// ============================================

function renderLootItems() {
    const items = lootState.filtered;
    
    if (items.length === 0) {
        return `
            <div class="loot-empty">
                <span class="loot-empty-icon">📭</span>
                <p>Нет предметов</p>
                <span class="loot-empty-hint">Загрузите Loot.json в папку MPG_LootExtractor</span>
            </div>
        `;
    }
    
    let html = '';
    let currentChar = '';
    
    items.forEach(key => {
        const item = lootState.data[key];
        const firstChar = key.charAt(0).toUpperCase();
        
        if (firstChar !== currentChar) {
            currentChar = firstChar;
            html += `<div class="loot-letter-divider">${currentChar}</div>`;
        }
        
        const categoryLabel = CATEGORIES[item.category] || 'Разное';
        const categoryClass = item.category || 'other';
        
        html += `
            <div class="loot-item" onclick="copyLootClass('${key}')" title="Кликните чтобы скопировать">
                <div class="loot-item-info">
                    <span class="loot-item-name">${item.name}</span>
                    <span class="loot-item-class">${key}</span>
                </div>
                <span class="loot-item-category ${categoryClass}">${categoryLabel}</span>
                <button class="loot-item-copy" onclick="event.stopPropagation(); copyLootClass('${key}')" title="Копировать">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                </button>
            </div>
        `;
    });
    
    return html;
}

// ============================================
// ФИЛЬТРАЦИЯ
// ============================================

function filterLoot() {
    const searchInput = document.getElementById('lootSearch');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    lootState.searchTerm = searchTerm;
    
    let filtered = Object.keys(lootState.data);
    
    if (lootState.currentCategory !== 'all') {
        filtered = filtered.filter(key => 
            lootState.data[key].category === lootState.currentCategory
        );
    }
    
    if (searchTerm) {
        filtered = filtered.filter(key => {
            const item = lootState.data[key];
            return item.name.toLowerCase().includes(searchTerm) ||
                   key.toLowerCase().includes(searchTerm);
        });
    }
    
    lootState.filtered = filtered;
    
    const list = document.getElementById('lootList');
    if (list) {
        list.innerHTML = renderLootItems();
    }
    
    updateStats();
}

function filterLootByCategory(category) {
    lootState.currentCategory = category;
    updateCategoryButtons();
    
    const searchInput = document.getElementById('lootSearch');
    if (searchInput) {
        filterLoot();
    }
}

function updateCategoryButtons() {
    document.querySelectorAll('.loot-cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === lootState.currentCategory);
    });
}

function updateStats() {
    const stats = document.getElementById('lootStats');
    if (!stats) return;
    
    const totalInCategory = lootState.currentCategory === 'all' ? 
        Object.keys(lootState.data).length : 
        Object.values(lootState.data).filter(d => d.category === lootState.currentCategory).length;
    
    stats.innerHTML = `
        <div class="loot-stat-item">
            <span class="loot-stat-number">${lootState.filtered.length}</span>
            <span class="loot-stat-label">Найдено</span>
        </div>
        <div class="loot-stat-item">
            <span class="loot-stat-number">${totalInCategory}</span>
            <span class="loot-stat-label">В категории</span>
        </div>
    `;
}

// ============================================
// КОПИРОВАНИЕ
// ============================================

function copyLootClass(className) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(className).then(() => {
            if (typeof notifications !== 'undefined') {
                notifications.success(`Скопировано: ${className}`);
            }
        }).catch(() => {
            fallbackCopy(className);
        });
    } else {
        fallbackCopy(className);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        if (typeof notifications !== 'undefined') {
            notifications.success(`Скопировано: ${text}`);
        }
    } catch (e) {
        if (typeof notifications !== 'undefined') {
            notifications.error('Не удалось скопировать');
        }
    }
    document.body.removeChild(textarea);
}

// ============================================
// ВОЗВРАТ К ПЛИТКАМ
// ============================================

function lootBackToTiles() {
    // Удаляем кнопку "Наверх"
    destroyScrollTopButton();
    
    if (typeof window.backToTiles === 'function') {
        window.backToTiles();
    } else {
        const container = document.getElementById('editorContentArea');
        if (container && typeof initEditorsPage === 'function') {
            container.innerHTML = `
                <div class="editor-placeholder">
                    <div class="editor-placeholder-icon">⏳</div>
                    <p>Возврат...</p>
                </div>
            `;
            setTimeout(() => {
                if (typeof initEditorsPage === 'function') {
                    initEditorsPage();
                }
            }, 300);
        }
    }
}

// ============================================
// ЭКСПОРТ
// ============================================

window.initLootExtractor = initLootExtractor;
window.filterLoot = filterLoot;
window.filterLootByCategory = filterLootByCategory;
window.copyLootClass = copyLootClass;
window.lootBackToTiles = lootBackToTiles;

console.log('📦 loot_extractor.js загружен');