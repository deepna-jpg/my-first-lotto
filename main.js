// Jeju Weather Guard - Main Logic

// Configuration
const CONFIG = {
    CLOUDFLARE_API_URL: 'https://weather.your-subdomain.workers.dev', 
    GEMINI_API_KEY: '', 
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
};

let allPlaces = [];
let currentItinerary = [];
let isPivoted = false;
let currentCondition = '';

// Initialize the app
async function init() {
    try {
        const response = await fetch('places.json');
        allPlaces = await response.json();
        
        generateInitialItinerary();
        renderItinerary();
        updateWeather();
        setupEventListeners();
        requestNotificationPermission();
    } catch (error) {
        console.error('앱 초기화 실패:', error);
    }
}

function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission();
    }
}

function showNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/1163/1163736.png' });
    }
}

function generateInitialItinerary() {
    const shuffled = [...allPlaces].sort(() => 0.5 - Math.random());
    currentItinerary = shuffled.slice(0, 4);
}

function renderItinerary() {
    const list = document.getElementById('itinerary-list');
    list.innerHTML = '';
    
    currentItinerary.forEach(spot => {
        const card = document.createElement('div');
        const typeLabel = spot.type === 'indoor' ? '실내' : '실외';
        card.className = `spot-card ${spot.type === 'indoor' ? 'indoor' : ''} ${isPivoted ? 'pivoted' : ''}`;
        
        card.innerHTML = `
            <div class="spot-info">
                <h4>${spot.name}</h4>
                <div class="spot-meta">
                    <span class="badge badge-${spot.type}">${typeLabel}</span>
                    <span>• ${spot.region}</span>
                    <span>• ${spot.category}</span>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

async function updateWeather(mockType = null) {
    const weatherEl = document.getElementById('current-weather');
    const alertEl = document.getElementById('weather-alert');
    const alertIcon = document.getElementById('alert-icon');
    const alertTitle = document.getElementById('alert-title');
    
    if (mockType) {
        currentCondition = mockType;
        const conditionText = mockType === 'rain' ? '비' : '폭염';
        const conditionEmoji = mockType === 'rain' ? '🌧️' : '☀️';
        weatherEl.textContent = `${conditionEmoji} ${conditionText} (감지됨)`;
        
        alertIcon.textContent = conditionEmoji;
        alertTitle.textContent = `갑자기 ${conditionText}가 오네요!`;
        alertEl.classList.remove('hidden');
        
        // 브라우저 알림 발송
        showNotification(`[제주 웨더 가드] 날씨 경보`, `현재 제주에 ${conditionText}가 감지되었습니다. 일정을 변경하시겠습니까?`);
        
        hideSelectionUI();
        return;
    }

    weatherEl.textContent = '☀️ 맑음 (22°C)';
    currentCondition = 'clear';
}

function hideSelectionUI() {
    document.getElementById('category-selection').classList.add('hidden');
    document.getElementById('option-selection').classList.add('hidden');
    document.getElementById('plan-b-section').classList.add('hidden');
}

async function handleCategoryChoice(category) {
    document.getElementById('category-selection').classList.add('hidden');
    
    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';
    const filtered = allPlaces.filter(p => p.category === category && p.type === 'indoor');
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, 3);
    
    selectedOptions.forEach(option => {
        const card = document.createElement('div');
        card.className = 'option-card';
        card.innerHTML = `<h4>${option.name}</h4><p>${option.region} • ${option.category}</p>`;
        card.onclick = () => finalizePlanB(option);
        optionsList.appendChild(card);
    });
    
    const section = document.getElementById('plan-b-section');
    section.classList.remove('hidden');
    
    await generateCategoryGuide(currentCondition, category);
    document.getElementById('option-selection').classList.remove('hidden');
}

async function generateCategoryGuide(condition, category) {
    const messageEl = document.getElementById('plan-b-message');
    messageEl.textContent = `제미나이가 여행 팁을 준비 중입니다...`;
    
    const conditionKr = condition === 'rain' ? '비가 내리는' : '폭염인';
    const prompt = `현재 제주의 날씨는 ${conditionKr} 상태입니다. 사용자가 대안 테마로 '${category}'을(를) 선택했습니다. 이 테마를 즐기기 좋은 이유와 팁을 한국어로 2문장 내외로 알려주세요.`;

    try {
        if (!CONFIG.GEMINI_API_KEY) throw new Error('Key missing');
        const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const tip = data.candidates[0].content.parts[0].text;
        messageEl.textContent = tip;
        
        // 생성된 팁을 알림으로도 발송
        showNotification("✨ 제미나이의 팁", tip);
    } catch (error) {
        messageEl.textContent = `${category} 테마는 ${conditionKr} 날씨에 제주를 즐기기 가장 쾌적한 선택이에요!`;
    }
}

async function finalizePlanB(chosenSpot) {
    isPivoted = true;
    const outdoorIndex = currentItinerary.findIndex(s => s.type === 'outdoor');
    if (outdoorIndex !== -1) currentItinerary[outdoorIndex] = chosenSpot;
    else currentItinerary[0] = chosenSpot;
    
    renderItinerary();
    document.getElementById('option-selection').classList.add('hidden');
    document.getElementById('plan-b-message').textContent = `${chosenSpot.name}으로 일정을 업데이트했습니다!`;
}

// 트리플 사진 분석 기능
async function handleTripleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('upload-status');
    statusEl.textContent = "AI가 사진에서 일정을 분석 중입니다...";

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target.result.split(',')[1];
        
        const prompt = "This is a screenshot of a travel itinerary from the Triple app. Extract the names of the places (tourist spots, restaurants, etc.). Return only a JSON array of strings containing the place names.";

        try {
            if (!CONFIG.GEMINI_API_KEY) throw new Error('Key missing');
            
            const response = await fetch(`${CONFIG.GEMINI_API_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: file.type, data: base64Image } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const textResponse = data.candidates[0].content.parts[0].text;
            const placeNames = JSON.parse(textResponse.match(/\[.*\]/s)[0]);
            
            // 추출된 장소들로 일정 업데이트
            currentItinerary = placeNames.map((name, index) => {
                const found = allPlaces.find(p => p.name.includes(name)) || {
                    id: 100 + index,
                    name: name,
                    type: 'outdoor',
                    region: '제주',
                    category: '기타'
                };
                return found;
            }).slice(0, 4);

            renderItinerary();
            statusEl.textContent = "✅ 트리플 일정 연동 완료!";
            showNotification("✅ 연동 성공", "트리플 일정을 성공적으로 불러왔습니다. 날씨 감시를 시작합니다.");
        } catch (error) {
            console.error(error);
            statusEl.textContent = "❌ 분석 실패 (API 키를 확인하세요)";
        }
    };
    reader.readAsDataURL(file);
}

function setupEventListeners() {
    document.getElementById('btn-simulate-rain').addEventListener('click', () => updateWeather('rain'));
    document.getElementById('btn-simulate-hot').addEventListener('click', () => updateWeather('hot'));
    document.getElementById('btn-reset-weather').addEventListener('click', () => {
        isPivoted = false;
        hideSelectionUI();
        document.getElementById('weather-alert').classList.add('hidden');
        generateInitialItinerary();
        renderItinerary();
        updateWeather();
    });

    document.getElementById('btn-change-plan').onclick = () => {
        document.getElementById('weather-alert').classList.add('hidden');
        document.getElementById('category-selection').classList.remove('hidden');
    };

    document.getElementById('btn-keep-plan').onclick = () => {
        document.getElementById('weather-alert').classList.add('hidden');
    };

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.onclick = () => handleCategoryChoice(btn.dataset.category);
    });

    document.getElementById('triple-upload').addEventListener('change', handleTripleUpload);
}

init();
