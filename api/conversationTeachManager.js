// Main conversation state storage for teaching
const conversationState = {};

// Categories and feedback types for teaching
const categories = ["instruction", "class materials"];
const feedbackTypes = ["strengths", "improvements"];

// Helper function to generate initial questions for the teaching model using ChatGPT
async function generateTeachInitialQ(category, feedbackType, openai) {
    const prompt = `Rephrase this question in a friendly and conversational tone: 
                    "What do you think are the ${feedbackType} of the ${category} in the current course?"`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
    });

    return response.choices[0].message.content;
}

// Helper function to generate clarifying questions for the teaching model using ChatGPT
async function generateTeachClarifyingQ(userResponse, feedbackType, openai) {
    const prompt = `The user provided this feedback: "${userResponse}". 
                    Generate a follow-up question that encourages the user to make the feedback more 
                    ${feedbackType === 'strengths' ? 'justifiable' : 'actionable'}, in a friendly tone.`;

    const clarificationResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
    });

    return clarificationResponse.choices[0].message.content;
}

// Main function to handle user messages for the teaching model
async function handleMessage(userId, message, openai) {
    if (!conversationState[userId]) {
        const assignedVersion = assignVersion();
        conversationState[userId] = {
            version: assignedVersion,
            messages: [],
            awaitingConfirmation: true,
            currentCategoryIndex: 0,
            currentFeedbackType: 0,
            awaitingFirstFeedback: true,
            previousResponses: []  // Store previous responses to prevent repetition
        };

        const introMessage = `Hi, I'm Evalubot for teaching assistance. 
                              I'll help gather feedback related to instruction and class materials. 
                              Reply with 'ok' to continue.`;
        conversationState[userId].messages.push({ role: 'assistant', content: introMessage });
        return introMessage;
    }

    const userState = conversationState[userId];

    // Handle end of conversation
    if (message.toLowerCase() === 'end') {
        delete conversationState[userId];
        return 'Thank you for providing feedback! Feel free to start a new session if needed.';
    }

    // Handle user confirmation
    if (userState.awaitingConfirmation) {
        if (message.toLowerCase() === 'ok') {
            userState.awaitingConfirmation = false;
            userState.awaitingFirstFeedback = true;
        } else {
            return "Please reply with 'ok' to continue.";
        }
    }

    // Route the conversation to the assigned version
    if (userState.version === 'adaptive') {
        return await handleAdaptiveTeachVersion(userId, message, openai);
    } else {
        return await handleHybridTeachVersion(userId, message, openai);
    }
}

// Function to handle the adaptive version for teaching
async function handleAdaptiveTeachVersion(userId, message, openai) {
    const userState = conversationState[userId];

    // Add the user message to the conversation history
    userState.messages.push({ role: 'user', content: message });

    // If it's the first message in adaptive mode, create the initial prompt
    if (userState.messages.length === 1) {
        userState.messages = createTeachAdaptivePrompt();
    }

    // Call OpenAI's ChatGPT for response
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: userState.messages,
            max_tokens: 200,
            temperature: 0.7,
        });

        const botReply = response.choices[0].message.content;
        userState.messages.push({ role: 'assistant', content: botReply });

        return botReply;
    } catch (error) {
        console.error('Error connecting to OpenAI:', error);
        return 'An error occurred while communicating with Evalubot. Please try again later.';
    }
}

// Function to handle the hybrid version for teaching
async function handleHybridTeachVersion(userId, message, openai) {
    const userState = conversationState[userId];

    // Add the user message to the conversation history
    userState.messages.push({ role: 'user', content: message });

    // Ensure the first feedback question is asked before checking constructiveness
    if (userState.awaitingFirstFeedback) {
        userState.awaitingFirstFeedback = false;

        // Generate the first feedback question using ChatGPT
        const firstCategory = categories[userState.currentCategoryIndex];
        const firstFeedbackType = feedbackTypes[userState.currentFeedbackType];
        const firstQuestion = await generateTeachInitialQ(firstCategory, firstFeedbackType, openai);
        userState.messages.push({ role: 'assistant', content: firstQuestion });

        return firstQuestion;
    }

    // Let ChatGPT assess the constructiveness of the response
    const feedbackType = feedbackTypes[userState.currentFeedbackType];
    const constructivenessAssessment = await assessConstructiveness(message, feedbackType, openai);

    // Handle the constructiveness assessment result
    if (constructivenessAssessment.toLowerCase().includes("constructive")) {
        // Move to the next feedback type or category
        if (userState.currentFeedbackType < feedbackTypes.length - 1) {
            userState.currentFeedbackType++;
        } else if (userState.currentCategoryIndex < categories.length - 1) {
            userState.currentCategoryIndex++;
            userState.currentFeedbackType = 0;
        } else {
            const finalResponse = "Thank you for all your feedback! Feel free to share more thoughts.";
            userState.messages.push({ role: 'assistant', content: finalResponse });
            return finalResponse;
        }

        // Generate the next question dynamically using ChatGPT
        const nextCategory = categories[userState.currentCategoryIndex];
        const nextFeedbackType = feedbackTypes[userState.currentFeedbackType];
        const nextQuestion = await generateTeachInitialQ(nextCategory, nextFeedbackType, openai);
        userState.messages.push({ role: 'assistant', content: nextQuestion });

        return nextQuestion;
    } else {
        // If not constructive, return the suggested improvement from ChatGPT
        userState.messages.push({ role: 'assistant', content: constructivenessAssessment });
        return constructivenessAssessment;
    }
}

// Helper function to create the initial system prompt for adaptive teaching
function createTeachAdaptivePrompt() {
    return [
        {
            role: 'system',
            content: `You are Evalubot for teaching. Your goal is to guide users to provide feedback on 
                      instruction and class materials. Ask one question at a time, wait for the user's response, 
                      and then proceed to the next question. Make sure each response is specific, justifiable, and actionable.
                      If a response is not constructive, suggest ways to improve it.`
        }
    ];
}

// Function to randomly assign a version (adaptive, hybrid)
function assignVersion() {
    const versions = ['adaptive', 'hybrid'];
    return versions[Math.floor(Math.random() * versions.length)];
}

module.exports = { handleMessage };
