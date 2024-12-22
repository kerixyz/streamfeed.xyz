// conversationManager.js
const conversationState = {};

// Categories and feedback types for the manual version
const categories = ["marketing strategies", "content production", "community management"];
const feedbackTypes = ["strengths", "improvements"];

// Function to generate dynamic and adaptive questions for the manual version
function generateQuestion(category, feedbackType, streamerName) {
  const strengthsPhrases = [
    `What do you think are ${streamerName}'s strengths when it comes to ${category}?`,
    `In terms of ${category}, what stands out to you as ${streamerName}'s biggest strengths?`,
    `How would you describe ${streamerName}'s strengths in their approach to ${category}?`,
    `What aspects of ${category} do you think ${streamerName} excels at?`
  ];

  const improvementsPhrases = [
    `Where do you think ${streamerName} could improve in terms of ${category}?`,
    `Are there any areas in ${category} where you think ${streamerName} could do better?`,
    `What suggestions do you have for ${streamerName} to enhance their ${category}?`,
    `How could ${streamerName} improve their efforts in ${category}?`
  ];

  // Randomly select a phrase based on the feedback type
  if (feedbackType === "strengths") {
    return strengthsPhrases[Math.floor(Math.random() * strengthsPhrases.length)];
  } else {
    return improvementsPhrases[Math.floor(Math.random() * improvementsPhrases.length)];
  }
}

// Function to generate clarifying questions
function generateClarifyingQuestion(feedbackType) {
  if (feedbackType === "strengths") {
    return "Can you provide more details about why this is a strength and how it impacts the stream positively?";
  } else {
    return "Can you clarify how this improvement can be implemented or why it’s important for the stream?";
  }
}

// Function to check if a response is overly negative
function isNegative(response) {
    const negativeKeywords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'useless'];
    return negativeKeywords.some(keyword => response.toLowerCase().includes(keyword));
}
  
// Function to check if a response is unhelpful
function isUnhelpful(response) {
    const vagueKeywords = ['okay', 'fine', 'good', 'bad', 'meh', 'average'];
    return vagueKeywords.some(keyword => response.toLowerCase().includes(keyword));
}
  
// Function to check if a response is constructive
function isConstructive(response, feedbackType, userState) {
    const trimmedResponse = response.trim();
    const minLengthCheck = trimmedResponse.length >= 5;  // Specificity check (min 5 characters)

    // Justification check only for strengths
    const justificationCheck =
        feedbackType === "strengths"
        ? /because|due to|as a result/.test(trimmedResponse.toLowerCase())
        : true;

    // Actionability check only for improvements
    const actionabilityCheck =
        feedbackType === "improvements"
        ? /should|could|need to|try to/.test(trimmedResponse.toLowerCase())
        : true;

    // Prevent repeated responses (e.g., copy-pasting)
    const isRepeatedResponse = userState.previousResponses.includes(trimmedResponse);

    // Add the current response to the list of previous responses
    userState.previousResponses.push(trimmedResponse);

    return minLengthCheck && justificationCheck && actionabilityCheck && !isRepeatedResponse;
}

async function generateHybridInitialQ(category, feedbackType, streamerName, openai) {
    const prompt = `Rephrase this question in a friendly and conversational tone: 
                    "What do you think are ${streamerName}'s ${feedbackType} in ${category}?"`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
    });

    return response.choices[0].message.content;
}
  
// Helper function to generate clarifying questions for the hybrid model using ChatGPT
async function generateHybridClarifyingQ(response, feedbackType, openai) {
    const prompt = `The user provided this feedback: "${response}". 
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

// Helper function to let ChatGPT assess constructiveness
async function assessHybridConstructiveness(message, feedbackType, openai) {
    const constructivenessPrompt = `
      The user provided the following feedback: "${message}". 
      Evaluate whether this feedback is:
      - Specific: Is the feedback detailed and clear, with at least 5 characters?
      - Justifiable (for strengths): Does the feedback include a reason why it's a strength (e.g., "because", "due to")?
      - Actionable (for improvements): Does the feedback suggest a possible action (e.g., "should", "could")?
  
      If the feedback is not fully constructive, suggest how it could be improved. 
      If it is constructive, respond with "constructive".
    `;
  
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: constructivenessPrompt }],
      max_tokens: 200,
      temperature: 0.7,
    });
  
    return response.choices[0].message.content;
  }
  
// Main function to handle user messages
async function handleMessage(userId, message, openai, streamerName) {
    if (!conversationState[userId]) {
      const assignedVersion = assignVersion();
      conversationState[userId] = {
        version: assignedVersion,
        messages: [],
        awaitingConfirmation: true,
        currentCategoryIndex: 0,
        currentFeedbackType: 0,
        streamerName,
        awaitingFirstFeedback: true,
        previousResponses: []  // Store previous responses to prevent repetition
      };
  
      const introMessage = `Hi, I'm a bot to help gather feedback for your streamer. 
                            I'll ask you some questions that we'll provide to the streamer 
                            and researchers studying this prototype. 
                            Reply with 'ok' to continue.`;
      conversationState[userId].messages.push({ role: 'assistant', content: introMessage });
      return introMessage;
    }
  
    const userState = conversationState[userId];
  
    // Handle end of conversation
    if (message.toLowerCase() === 'end') {
      delete conversationState[userId];
      return 'Thank you for using the bot! If you need more assistance, feel free to start a new conversation.';
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
    if (userState.version === 'manual') {
      return await handleManualVersion(userId, message, streamerName);
    } else if (userState.version === 'adaptive') {
      return await handleAdaptiveVersion(userId, message, openai);
    } else {
      return await handleHybridVersion(userId, message, openai, streamerName);
    }
}

// Function to handle the manual version
async function handleManualVersion(userId, message, streamerName) {
    const userState = conversationState[userId];

    // Add the user message to the conversation history
    userState.messages.push({ role: 'user', content: message });

    // Ensure the first feedback question is asked before checking constructiveness
    if (userState.awaitingFirstFeedback) {
        userState.awaitingFirstFeedback = false;

        // Generate the first feedback question
        const firstCategory = categories[userState.currentCategoryIndex];
        const firstFeedbackType = feedbackTypes[userState.currentFeedbackType];
        const firstQuestion = generateQuestion(firstCategory, firstFeedbackType, streamerName);
        userState.messages.push({ role: 'assistant', content: firstQuestion });

        return firstQuestion;
    }

    // Check if the response is overly negative
    if (isNegative(message)) {
        const negativeResponsePrompt = "That's pretty negative, could you rephrase that?";
        userState.messages.push({ role: 'assistant', content: negativeResponsePrompt });
        return negativeResponsePrompt;
    }

    // Check if the response is unhelpful
    if (isUnhelpful(message)) {
        const unhelpfulResponsePrompt = "That's not really helpful, could you rephrase that?";
        userState.messages.push({ role: 'assistant', content: unhelpfulResponsePrompt });
        return unhelpfulResponsePrompt;
    }

    // Check if the response is constructive with the new criteria
    const feedbackType = feedbackTypes[userState.currentFeedbackType];
    if (!isConstructive(message, feedbackType, userState)) {
        const clarifyingQuestion = generateClarifyingQuestion(feedbackType);
        userState.messages.push({ role: 'assistant', content: clarifyingQuestion });
        return clarifyingQuestion;
    }

    // Move to the next feedback type or category
    if (userState.currentFeedbackType < feedbackTypes.length - 1) {
        userState.currentFeedbackType++;
    } else if (userState.currentCategoryIndex < categories.length - 1) {
        userState.currentCategoryIndex++;
        userState.currentFeedbackType = 0;
    } else {
        const finalResponse = "Thank you for all your feedback! If you have more comments, type 'end' to finish or continue with additional feedback.";
        userState.messages.push({ role: 'assistant', content: finalResponse });
        return finalResponse;
    }

    // Generate the next question dynamically
    const nextCategory = categories[userState.currentCategoryIndex];
    const nextFeedbackType = feedbackTypes[userState.currentFeedbackType];
    const nextQuestion = generateQuestion(nextCategory, nextFeedbackType, streamerName);
    userState.messages.push({ role: 'assistant', content: nextQuestion });

    return nextQuestion;
}

// Main function to handle the hybrid version
async function handleHybridVersion(userId, message, openai, streamerName) {
    const userState = conversationState[userId];
  
    // Add the user message to the conversation history
    userState.messages.push({ role: 'user', content: message });
  
    // Ensure the first feedback question is asked before checking constructiveness
    if (userState.awaitingFirstFeedback) {
      userState.awaitingFirstFeedback = false;
  
      // Generate the first feedback question using ChatGPT
      const firstCategory = categories[userState.currentCategoryIndex];
      const firstFeedbackType = feedbackTypes[userState.currentFeedbackType];
      const firstQuestion = await generateHybridInitialQ(firstCategory, firstFeedbackType, streamerName, openai);
      userState.messages.push({ role: 'assistant', content: firstQuestion });
  
      return firstQuestion;
    }
  
    // Let ChatGPT assess the constructiveness of the response
    const feedbackType = feedbackTypes[userState.currentFeedbackType];
    const constructivenessAssessment = await assessHybridConstructiveness(message, feedbackType, openai);
  
    // Handle the constructiveness assessment result
    if (constructivenessAssessment.toLowerCase().includes("constructive")) {
      // Move to the next feedback type or category
      if (userState.currentFeedbackType < feedbackTypes.length - 1) {
        userState.currentFeedbackType++;
      } else if (userState.currentCategoryIndex < categories.length - 1) {
        userState.currentCategoryIndex++;
        userState.currentFeedbackType = 0;
      } else {
        const finalResponse = "Thank you for all your feedback! If you have more comments, type 'end' to finish or continue with additional feedback.";
        userState.messages.push({ role: 'assistant', content: finalResponse });
        return finalResponse;
      }
  
      // Generate the next question dynamically using ChatGPT
      const nextCategory = categories[userState.currentCategoryIndex];
      const nextFeedbackType = feedbackTypes[userState.currentFeedbackType];
      const nextQuestion = await generateHybridInitialQ(nextCategory, nextFeedbackType, streamerName, openai);
      userState.messages.push({ role: 'assistant', content: nextQuestion });
  
      return nextQuestion;
    } else {
      // If not constructive, return the suggested improvement from ChatGPT
      userState.messages.push({ role: 'assistant', content: constructivenessAssessment });
      return constructivenessAssessment;
    }
}

// Function to handle the adaptive version
async function handleAdaptiveVersion(userId, message, openai) {
  const userState = conversationState[userId];

  // Add the user message to the conversation history
  userState.messages.push({ role: 'user', content: message });

  // If it's the first message in adaptive mode, create the initial prompt
  if (userState.messages.length === 1) {
    userState.messages = createAdaptivePrompt(userState.streamerName);
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

// Helper function to create the initial system prompt for the adaptive version
function createAdaptivePrompt(streamerName) {
    return [
      {
        role: 'system',
        content: `You are a chatbot that gathers feedback about streamers.
                Guide users step-by-step across three categories: marketing strategies, content production, and community management.

                    Conversational Flow:
                        Ask one question at a time and wait for the user's response before moving to the next question.
                        After each response:
                            Acknowledge the input with a brief, friendly comment like:
                            "Thank you for your input! That's very helpful."
                            Ask the next question in the same message:
                            "Now, let's move on to the next topic. What do you think about the streamer's content production? Can you share one strength?"
                        Keep the conversation focused on strengths and improvements, ensuring that the feedback is:
                            Specific: The response should have at least 5 characters.
                            Justifiable: For strengths, users should explain why it's a strength.
                            Actionable: For improvements, users should suggest how the streamer could improve.

                    Handling Responses:
                        If a response is overly negative (e.g., uses words like "terrible", "useless") ask them to rephrase.
                        If a response is too vague (e.g., "okay", "fine"), ask them to rephrase.
                        If a response does not meet the criteria for constructiveness, ask for more details or clarification before proceeding.

                    Redirecting Off-Topic Responses:
                        If the user tries to deviate from the topic or discusses unrelated matters, bring the conversation back to getting feedback for their streamer.

                    Ensuring Sufficient Data:
                        Continue asking questions or prompting for additional details within each category until there is enough data to process.
                        "Enough data" is defined as:
                            At least one strength and one area for improvement for each category (marketing strategies, content production, and community management).
                        If the user provides incomplete feedback, encourage them to expand.

                    By maintaining a focused and iterative approach, your goal is to ensure that the feedback collected is thorough, constructive, and relevant to the three categories.`
      }
    ];
}
  
// Function to randomly assign a version
function assignVersion() {
    // const versions = ['adaptive', 'hybrid'];
    // return versions[Math.floor(Math.random() * versions.length)];
    return version='adaptive';
  }
  

module.exports = { handleMessage };
