import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import DashboardView from '../components/DashboardView';

// Environment toggle (local vs. Heroku)
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const Chat = () => {
  const { streamer } = useParams();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [isStreamer, setIsStreamer] = useState(false);
  const [error, setError] = useState(null);
  const [userVersion, setUserVersion] = useState('adaptive'); // Default to 'adaptive' or set logic for assigning version

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    // Check if it's a streamer view by presence of token
    if (token) {
      verifyStreamerAccess(token);
    } else {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        loadChatHistory(storedUserId); // Load chat history for viewers
      }
    }
  }, [streamer, location]);

  // Function to verify streamer's token
  const verifyStreamerAccess = async (token) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/verify-dashboard-access?streamerName=${streamer}&token=${token}`
      );
      if (response.data.valid) {
        setIsStreamer(true); // Token is valid, user is a streamer
        await loadChatHistory(); // Load chat history for streamers
      } else {
        setError('Invalid token or unauthorized access');
      }
    } catch (err) {
      console.error('Error verifying token:', err);
      setError('Unable to verify token');
    }
  };

  const loadChatHistory = async (id = null) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/get-chat-messages?${id ? `userId=${id}&` : ''}streamerName=${streamer}`
      );
  
      if (response.data.messages) {
        const filteredMessages = response.data.messages.filter(msg => msg.message && msg.message.trim() !== '');
        const formattedMessages = filteredMessages.map(msg => ({
          role: msg.role,
          content: msg.message,
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };
  
  // Handle name submission for viewers
  const handleNameSubmit = async () => {
    if (userName.trim() !== '') {
      const generatedUserId = `viewer_${userName}_${Date.now()}`;
      setUserId(generatedUserId);
      localStorage.setItem('userId', generatedUserId);

      // Start chat history
      loadChatHistory(generatedUserId);
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' || !userId) return;
  
    const newMessage = { role: 'user', content: input };
    setMessages([...messages, newMessage]);
  
    try {
      // Save the message to the chat_messages table
      await axios.post(`${BASE_URL}/save-chat-message`, {
        userId,
        streamerName: streamer,
        message: input,
        role: 'user',
        version: userVersion // Include user version with each message
      });
  
      // Get the response from the chatbot API
      const response = await axios.post(`${BASE_URL}/chat`, {
        userId,
        message: input,
      });
  
      if (response.data && response.data.reply) {
        const botMessage = { role: 'bot', content: response.data.reply };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
  
        // Save the bot's reply to the chat_messages table
        await axios.post(`${BASE_URL}/save-chat-message`, {
          userId,
          streamerName: streamer,
          message: response.data.reply,
          role: 'bot',
          version: userVersion // Include user version with bot messages as well
        });
      } else {
        console.error('Unexpected response structure:', response.data);
      }
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
    }
  
    setInput('');
  };
  

  return (
      <div className="min-h-screen flex flex-col items-center py-10 px-4 md:px-6 bg-white">
      {/* Streamer Dashboard */}
      {isStreamer && <DashboardView streamer={streamer} />}
  
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded max-w-md">
          {error}
        </div>
      )}
  
      {/* Name Input for Viewers */}
      {!isStreamer && !userId && (
        <div className="w-full max-w-md mb-6">
          <h2 className="text-xl font-semibold mb-2">Enter your name to start chatting:</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name..."
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleNameSubmit}
            className="w-full bg-blue-600 text-white py-2 mt-2 rounded-lg hover:bg-blue-500 transition"
          >
            Start Chatting
          </button>
        </div>
      )}
  
      {/* Chat Box */}
      {userId && (
        <>
          <p>Thanks for giving feedback to {streamer}. Your thoughts are valuable and will help improve their content. To get started, simply say <strong>`hello`</strong> and start sharing your feedback!</p>
          <div className="flex flex-col w-full max-w-4xl md:max-w-2xl lg:max-w-lg bg-gray-100 rounded-lg shadow-md overflow-hidden">
            {/* Messages Container */}
            <div className="flex-grow h-96 md:h-80 overflow-auto p-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-900'} max-w-xs md:max-w-md lg:max-w-lg`}>
                    <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
                  </div>
                </div>
              ))}
            </div>
  
            {/* Input Container */}
            <div className="flex items-center border-t p-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && input.trim() !== '') {
                    handleSendMessage();
                  }
                }}
                className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-500 transition"
              >
                Send
              </button>
            </div>
          </div>
          {/* Footer Section */}
          <footer className="py-6 px-6 bg-white text-gray-600">
            <p>This is an ongoing research project at the University of Washington. Please note that this tool is a prototype so please excuse all the delays and potential errors. If you are also interested in sharing your experience with this tool as a viewer, please reach out to @Kehree on Discord. </p>
            
            <p>We collect and analyze feedback to better understand how streamers engage with their audiences. Your participation is voluntary, and all data will be anonymized to ensure your privacy. For questions, comments, or feedback, please contact: kmallari[at]uw[dot]edu</p>
          </footer>
        </>
      )}
    </div>
  );
};

export default Chat;
