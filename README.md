# E-learning Web with Proactive AI Tutor
E-learning Framework Used in the Study: Intervention Strategies of Proactive AI Tutor

**Research Objectives**

- Evaluate the impact of different levels of AI tutor intervention.
- Determine how each level of intervention affects students' learning outcomes and learning experiences.

Therefore, we categorize intervention levels into 1) Passive Support, 2) Notification, 3) Suggestion, and 4) Active Support, and implement GPT-based AI chatbots with different interaction scenarios for each level to conduct experiments.

**Details**

- Web Development: HTML, CSS, JS, Flask API
- AI Chatbot: GPT-3.5-turbo model
- GPT Reference Material: Transcribe the lecture video into a text file using an Google Speech to Text (STT) model.
- User Action: Watching a lecture, Asking questions, Taking quizzes

**User Study Results**

The results of the user study conducted using this E-learning framework, which analyzed the overall learning experience of the students, are summarized in the 'poster.pdf' file.

**Guideline**

- To use it, you need to obtain an API key for GPT. (I used a paid subscription.)
- The learning materials used are organized in the dataset folder, which contains quiz materials created by GPT based on learning objectives analyzed from video content. (I utilized the introductory videos on reinforcement learning from the MATLAB Korea YouTube channel. The content was transcribed using the Google Speech-to-Text model and then incorporated into the chatbot scenarios.)
- The code for the chatbot operates using the O/X quizzes from this dataset. If necessary, you can modify the chatbot using the provided dataset.
- User logs are stored after the user information is entered and saved. Note that log storage stops when the user logs out.


This was utilized in the research for the Creative Autonomous Project in June 2024.
