document.getElementById('userInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    var inputField = document.getElementById('userInput');
    var message = inputField.value.trim();
    if (message === '') return;
    inputField.value = '';
    displayUserMessage(message);

    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => { throw new Error(error.response); });
        }
        return response.json();
    })
    .then(data => {
        displayBotMessage(data.response);
    })
    .catch(error => {
        console.error('Error:', error);
        displayBotMessage("An error has occurred.");
    });
}

function displayUserMessage(message) {
    const chatLog = document.getElementById('chatLog');
    const messageContainer = document.createElement('div');
    const nameLabel = document.createElement('div');
    const messageElement = document.createElement('div');

    nameLabel.textContent = "User";
    nameLabel.className = "message-name";
    messageElement.textContent = message;
    messageElement.className = "message-content";

    messageContainer.appendChild(nameLabel);
    messageContainer.appendChild(messageElement);
    messageContainer.className = "user-message-bubble";

    chatLog.appendChild(messageContainer);
    chatLog.scrollTop = chatLog.scrollHeight;

    // 로그 기록
    logUserAction(message, null);
}

function displayBotMessage(message, callback) {
    const chatLog = document.getElementById('chatLog');
    const messageContainer = document.createElement('div');
    const nameLabel = document.createElement('div');
    const messageElement = document.createElement('div');

    nameLabel.textContent = "Tutor";
    nameLabel.className = "message-name";
    messageElement.className = "message-content";
    Object.values(learningObjectives).forEach(objective => {
        if (message.includes(objective)) {
            message = message.replace(objective, `<strong>${objective}</strong>`);
        }
    });

    messageElement.innerHTML = message;
    messageContainer.appendChild(nameLabel);
    messageContainer.appendChild(messageElement);
    messageContainer.className = "bot-message-bubble";

    chatLog.appendChild(messageContainer);
    chatLog.scrollTop = chatLog.scrollHeight;

    if (callback) {
        callback();
    }

    // 로그 기록
    logUserAction(null, message);
}

let activeFeature = 'passive';
let quizIndex = 0;
let currentMinutes = 0;
let logging = false;

document.addEventListener('DOMContentLoaded', function() {
    setActiveFeature('passive');
    loadQuizzes();
    document.getElementById('logoutButton').disabled = true; // 초기에는 로그아웃 버튼을 비활성화
});

document.getElementById('passiveSupport').addEventListener('click', function() {
    setActiveFeature('passive');
});

document.getElementById('notificationSupport').addEventListener('click', function() {
    setActiveFeature('notification');
});

document.getElementById('suggestionSupport').addEventListener('click', function() {
    setActiveFeature('suggestion');
});

document.getElementById('activeSupport').addEventListener('click', function() {
    setActiveFeature('active');
});

function setActiveFeature(feature) {
    activeFeature = feature;
    updateButtonStyles(feature);
    logUserStateChange(feature);  // 상태 변경 기록
}

function updateButtonStyles(active) {
    const buttons = document.querySelectorAll('.options button');
    buttons.forEach(button => {
        if (button.id === `${active}Support`) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

const video = document.getElementById('learningVideo');
video.addEventListener('timeupdate', () => {
    const currentTime = video.currentTime;
    checkTimeAndAct(currentTime);
});

const displayedMessages = {};
//const learningObjectives = {
//    349: "강화 학습(RL)이 무엇인지 정의하고, 머신러닝의 다른 분류 (지도 학습, 비지도 학습)와의 차이점을 이해한다.",
//    493: "강화 학습 문제 설정 방법과 구성요소(에이전트, 환경, 상태, 행동, 보상)의 역할을 설명할 수 있다.",
//    673: "가치 평가, 탐색(exploration)과 이용(exploitation) 개념 등을 이해하고 적용할 수 있다.",
//    762: "전통적인 제어 방식과 강화 학습의 차이점과 유사점을 이해한다.",
//    810: "탐색/이용 매개변수 및 미래 보상 할인 설정 등의 강화 학습의 세부 사항을 이해하고 조정할 수 있다."
//};
const learningObjectives = {
    349: "Define what Reinforcement Learning (RL) is and understand the differences between RL and other types of Machine Learning (Supervised Learning, Unsupervised Learning).",
    493: "Explain how to formulate a Reinforcement Learning problem and describe the roles of its components (Agent, Environment, State, Action, Reward).",
    673: "Understand and apply concepts such as value estimation, exploration, and exploitation.",
    762: "Understand the similarities and differences between traditional control methods and Reinforcement Learning.",
    810: "Understand and adjust specific details of Reinforcement Learning, such as exploration/exploitation parameters and future reward discount settings."
};


let quizzes = [];

function loadQuizzes() {
    fetch('/dataset/quiz_ox_dataset.json')
        .then(response => response.json())
        .then(data => {
            quizzes = data.quizzes;
            console.log("퀴즈 데이터 로드됨:", quizzes);
        })
        .catch(error => {
            console.error('퀴즈 로드 오류:', error);
        });
}

function fetchQuiz(minutes) {
    const objectiveId = minutes === 349 ? 1 : minutes === 493 ? 2 : minutes === 673 ? 3 : minutes === 762 ? 4 : 5;
    const objectiveQuizzes = quizzes.filter(q => q.objective_id === objectiveId);
    console.log('Minutes:', minutes);
    console.log('Objective ID:', objectiveId);
    console.log('Objective Quizzes:', objectiveQuizzes);

    if (objectiveQuizzes.length > 0) {
        if (quizIndex >= objectiveQuizzes.length) {
            quizIndex = 0;
            displayBotMessage("Now let's take the lecture again!", () => {
                enableVideoControls();
                video.play();
            });
        } else {
            presentQuiz(objectiveQuizzes[quizIndex]);
            disableVideoControls(); // 비디오 컨트롤 비활성화
        }
    } else {
        displayBotMessage("The appropriate quiz was not found.");
    }
}

function presentQuiz(quiz) {
    const chatLog = document.getElementById('chatLog');
    const messageContainer = document.createElement('div');
    const nameLabel = document.createElement('div');
    const quizDiv = document.createElement('div');

    nameLabel.textContent = "Tutor";
    nameLabel.className = "message-name";
    quizDiv.className = "message-content";
    quizDiv.innerHTML = `<p><strong>${quiz.question}</strong></p>
        <div class="options-container">
            <button onclick="checkAnswer('${quiz.answer}', 'O', '${quiz.explanation}', ${quiz.id}, this, '${quiz.question}')">O</button>
            <button onclick="checkAnswer('${quiz.answer}', 'X', '${quiz.explanation}', ${quiz.id}, this, '${quiz.question}')">X</button>
        </div>`;

    messageContainer.appendChild(nameLabel);
    messageContainer.appendChild(quizDiv);
    messageContainer.className = "bot-message-bubble";

    chatLog.appendChild(messageContainer);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function checkAnswer(correctAnswer, userAnswer, explanation, quizId, buttonElement, question) {
    const chatLog = document.getElementById('chatLog');
    const messageContainer = buttonElement.closest('.bot-message-bubble');
    const feedbackDiv = document.createElement('div');

    let feedbackHTML = `<p><strong>${question}</strong></p><p>선택: ${userAnswer}</p>`;
    if (correctAnswer === userAnswer) {
        feedbackHTML += `<p><strong>정답입니다!</strong><br><br>${explanation}</p>`;
    } else {
        feedbackHTML += `<p><strong>틀렸습니다.</strong><br><br>${explanation}</p>`;
    }

    feedbackDiv.innerHTML = feedbackHTML;
    feedbackDiv.className = "message-content";

    // 기존 퀴즈에 피드백을 추가
    messageContainer.innerHTML = '';
    messageContainer.appendChild(feedbackDiv);

    chatLog.scrollTop = chatLog.scrollHeight;

    // 다음 퀴즈로 이동
    setTimeout(() => {
        quizIndex++;
        fetchQuiz(currentMinutes);
    }, 1000);

    // 로그 기록
    logUserAction(userAnswer, feedbackHTML);
}

function disableVideoControls() {
    const videoContainer = document.getElementById('videoContainer');
    const videoOverlay = document.getElementById('videoOverlay');
    video.controls = false;
    videoOverlay.style.display = 'block';
}

function enableVideoControls() {
    const videoContainer = document.getElementById('videoContainer');
    const videoOverlay = document.getElementById('videoOverlay');
    video.controls = true;
    videoOverlay.style.display = 'none';
}

function continueLecture() {
    enableVideoControls();  // 비디오 컨트롤 활성화
    video.play();
}

// 5:49, 8:13, 11:13, 12:42, 13:30

// function checkTimeAndAct(currentTime) {
//     const minutes = Math.floor(currentTime);
//     currentMinutes = minutes; 
//     console.log("minute:",minutes)
//     if ([349, 493, 673, 762, 810].includes(minutes) && !displayedMessages[minutes]) {
//         displayedMessages[minutes] = true;
//         const objective = learningObjectives[minutes];
//         let message = "";
        
//         if (activeFeature === 'notification') {
//             message = `지금 이 부분은 학습 목표인 ${objective}를 다루고 있어서 매우 중요해요. 잘 이해하고 넘어가야합니다!`;
//             displayBotMessage(message);
//         } else if (activeFeature === 'suggestion') {
//             video.pause();
//             message = `지금 이 부분은 학습 목표인 ${objective}를 다루고 있어서 매우 중요해요. 잠깐 문제를 풀어보면서 더 알아볼래요?`;
//             displayBotMessage(message);  
//             displayOptions(minutes);
//         } else if (activeFeature === 'active') {
//             video.pause();
//             message = `지금 이 부분은 학습 목표인 ${objective}를 다루고 있어서 매우 중요해요. 추가 문제를 풀고 넘어가봅시다.`;
//             displayBotMessage(message, () => {
//                 setTimeout(() => {
//                     fetchQuiz(minutes);
//                 }, 1000);
//             });
//         }
//     } else if (!([349, 493, 673, 762, 810].includes(minutes))) {
//         displayedMessages[minutes] = false;
//     }
// }

function checkTimeAndAct(currentTime) {
    const minutes = Math.floor(currentTime);
    currentMinutes = minutes; 
    console.log("minute:", minutes);
    
    if ([349, 493, 673, 762, 810].includes(minutes) && !displayedMessages[minutes]) {
        displayedMessages[minutes] = true;
        const objective = learningObjectives[minutes];
        let message = "";
        
        if (activeFeature === 'notification') {
            message = `This section covers the learning objective: ${objective}, which is very important. Make sure you understand it well!`;
            displayBotMessage(message);
        } else if (activeFeature === 'suggestion') {
            video.pause();
            message = `This section covers the learning objective: ${objective}, which is very important. Would you like to try a quick question to reinforce your understanding?`;
            displayBotMessage(message);  
            displayOptions(minutes);
        } else if (activeFeature === 'active') {
            video.pause();
            message = `This section covers the learning objective: ${objective}, which is very important. Let's solve an additional question before moving on.`;
            displayBotMessage(message, () => {
                setTimeout(() => {
                    fetchQuiz(minutes);
                }, 1000);
            });
        }
    } else if (!([349, 493, 673, 762, 810].includes(minutes))) {
        displayedMessages[minutes] = false;
    }
}


function displayOptions(minutes) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = "options-container";  
    optionsDiv.innerHTML = `
        <button onclick="handleOption('fetchQuiz', ${minutes}, this)">문제 주세요</button>
        <button onclick="handleOption('continueLecture', ${minutes}, this)">강의 계속 들을래요</button>
    `;
    document.getElementById('chatLog').appendChild(optionsDiv);
}

function handleOption(option, minutes, buttonElement) {
    if (option === 'fetchQuiz') {
        fetchQuiz(minutes);
    } else if (option === 'continueLecture') {
        continueLecture();
    }
    buttonElement.parentElement.remove(); // 옵션 버튼 제거
}

// 유저 정보 모달 창 관련 기능
document.getElementById('userInfoButton').addEventListener('click', function() {
    document.getElementById('userInfoModal').style.display = "block";
});

document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('userInfoModal').style.display = "none";
});

window.addEventListener('click', function(event) {
    if (event.target === document.getElementById('userInfoModal')) {
        document.getElementById('userInfoModal').style.display = "none";
    }
});

document.getElementById('userInfoForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const userInfo = {
        name: document.getElementById('userName').value,
        age: document.getElementById('userAge').value,
        gender: document.getElementById('userGender').value,
        understanding: document.getElementById('userUnderstanding').value
    };
    fetch('/save_user_info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo)
    })
    .then(response => response.json())
    .then(data => {
        console.log('User info saved:', data);
        document.getElementById('userInfoModal').style.display = "none";
        document.getElementById('userInfoButton').textContent = userInfo.name; // 버튼 텍스트 변경
        logging = true; // 유저 정보가 저장된 후 로그 기록 시작
        document.getElementById('logoutButton').disabled = false; // 로그아웃 버튼 활성화
    })
    .catch(error => {
        console.error('Error saving user info:', error);
    });
});

// 로그아웃 시 로그 기록 중지 및 버튼 텍스트 초기화
document.getElementById('logoutButton').addEventListener('click', function() {
    fetch('/logout', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        console.log('User logged out:', data);
        logging = false; // 로그아웃 시 로그 기록 중지
        document.getElementById('userInfoButton').textContent = '유저 정보 입력'; // 버튼 텍스트 변경
        document.getElementById('logoutButton').disabled = true; // 로그아웃 버튼 비활성화
    })
    .catch(error => {
        console.error('Error logging out:', error);
    });
});

// 로그 기록 기능
function logUserAction(userMessage, botMessage) {
    if (!logging) return;  // 유저 정보가 저장되지 않으면 로그 기록을 하지 않음

    const logEntry = {
        timestamp: new Date().toISOString().split('T')[0],  // 간단한 타임스탬프 형식
        userMessage: userMessage,
        botMessage: botMessage,
        state: activeFeature // 현재 상태 추가
    };

    fetch('/log_user_action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Log entry saved:', data);
    })
    .catch(error => {
        console.error('Error logging user action:', error);
    });
}

function setActiveFeature(feature) {
    activeFeature = feature;
    updateButtonStyles(feature);
    logUserStateChange(feature);  // 상태 변경 기록
}

function logUserStateChange(feature) {
    if (!logging) return;  // 유저 정보가 저장되지 않으면 상태 변경 기록을 하지 않음

    const logEntry = {
        timestamp: new Date().toISOString().split('T')[0],  // 간단한 타임스탬프 형식
        event: 'state_change',
        state: feature
    };

    fetch('/log_user_action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
    })
    .then(response => response.json())
    .then(data => {
        console.log('State change logged:', data);
    })
    .catch(error => {
        console.error('Error logging state change:', error);
    });
}
