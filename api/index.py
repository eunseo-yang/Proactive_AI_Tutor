from flask import Flask, request, jsonify, send_from_directory
import openai
import logging
import os
import json
from datetime import datetime

app = Flask(__name__)
#openai.api_key = 'API KEY'
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

# 로깅 설정
logging.basicConfig(level=logging.DEBUG)
user_logs = {}
current_user = None

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '').strip()
    if not user_message:
        return jsonify({"response": "메시지가 비어 있습니다."}), 400

    try:
        messages = [
            {"role": "system", "content": "챗봇 대화 시작합니다. 모든 질문에 강화학습에 대해서 답변해주세요."},
            {"role": "user", "content": user_message}
        ]
        logging.debug(f"Sending messages to OpenAI: {messages}")

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        gpt_reply = response['choices'][0]['message']['content']
        logging.debug(f"Received response from OpenAI: {gpt_reply}")
        return jsonify({"response": gpt_reply})
    except Exception as e:
        logging.error(f"Error during OpenAI API call: {e}")
        return jsonify({"response": "오류가 발생했습니다."}), 500

@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')

@app.route('/dataset/<path:filename>')
def get_dataset(filename):
    return send_from_directory('dataset', filename)

@app.route('/save_user_info', methods=['POST'])
def save_user_info():
    global current_user, user_logs
    user_info = request.json
    current_user = user_info['name']
    user_logs[current_user] = {
        "event": "user_info_saved",
        "user_info": user_info,
        "timestamp": datetime.now().strftime("%Y-%m-%d-%H-%M")
    }
    save_logs_to_file()
    return jsonify({"status": "success", "user_info": user_info})

@app.route('/log_user_action', methods=['POST'])
def log_user_action():
    global user_logs, current_user
    if current_user is None:
        return jsonify({"status": "error", "message": "No user info saved"}), 400

    log_entry = request.json
    log_entry['timestamp'] = datetime.now().strftime("%Y-%m-%d-%H-%M")
    if "actions" not in user_logs[current_user]:
        user_logs[current_user]["actions"] = []
    user_logs[current_user]["actions"].append(log_entry)
    save_logs_to_file()
    return jsonify({"status": "success", "log_entry": log_entry})

@app.route('/logout', methods=['POST'])
def logout():
    global current_user
    current_user = None
    return jsonify({"status": "success", "message": "User logged out and log cleared"})

def save_logs_to_file():
    with open('user_logs.json', 'w', encoding='utf-8') as f:
        json.dump(user_logs, f, ensure_ascii=False, indent=4)

def save_user_info_to_file(user_info):
    user_info_file = 'user_info.json'
    if os.path.exists(user_info_file):
        with open(user_info_file, 'r', encoding='utf-8') as f:
            existing_user_info = json.load(f)
    else:
        existing_user_info = []

    existing_user_info.append(user_info)
    
    with open(user_info_file, 'w', encoding='utf-8') as f:
        json.dump(existing_user_info, f, ensure_ascii=False, indent=4)

# if __name__ == '__main__':
#     app.run(debug=True)
