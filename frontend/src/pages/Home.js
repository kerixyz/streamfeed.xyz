import React, { useState } from 'react';

// Environment toggle (local vs. Heroku)
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const Home = () => {
  const [streamerName, setStreamerName] = useState('');
  const [sessionLink, setSessionLink] = useState('');
  const [error, setError] = useState('');
  const [feedbackFromViewers, setFeedbackFromViewers] = useState(false);
  const [feedbackFromExternal, setFeedbackFromExternal] = useState(false);

//   console.log('API Base URL:', process.env.REACT_APP_API_BASE_URL);

  // Function to handle session creation
  const createSession = async () => {
    if (!feedbackFromViewers && !feedbackFromExternal) {
      setError('Please select at least one feedback option.');
      return;
    }
    setError('');
    try {
      const response = await fetch(`${BASE_URL}/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamerName,
          feedbackFromViewers,
          feedbackFromExternal,
        }),
      });
  
    //   console.log({
    //     streamerName,
    //     feedbackFromViewers,
    //     feedbackFromExternal,
    //   });
      
  
      if (response.ok) {
        const data = await response.json();
        setSessionLink(data.link);
      } else {
        setError('Failed to create session. Please try again.');
      }
    } catch (err) {
      console.error('Error creating session:', err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* First Section */}
      <section className="flex flex-col md:flex-row items-center justify-between py-10 px-6 bg-gray-100">
        {/* Left Side: Center-aligned Text */}
        <div className="md:w-1/2 mb-6 md:mb-0 md:pl-8 max-w-lg text-center md:text-left">
          <h1 className="text-4xl font-bold mb-4">StreamFeed</h1>
          <p className="text-lg">
            StreamFeed helps you get detailed feedback on your streams. See through your viewers' eyes and make improvements in real-time.
          </p>

          {/* Sign Up to Be a Beta Tester */}
          <div className="mt-4">
            <p className="text-gray-700 mb-3">
              Interested in helping us improve StreamFeed? Join our beta testing program to provide valuable feedback!
            </p>
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSf8vFkBqF4mxBMAkusnMtNrl6yroEUR0z1zViY8aWXv1guVSg/viewform" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-500 transition"
            >
              Sign Up To Be a Beta Tester
            </a>
          </div>
        </div>

        {/* Right Side: Placeholder for sample report */}
        <div className="md:w-1/2 flex justify-center">
          <div className="bg-gray-200 flex items-center justify-center rounded-md overflow-hidden">
            <img src="/samplereport.png" alt="Sample Report" className="w-full h-auto rounded-md" />
          </div>
        </div>

      </section>
      
      {/* Second Section */}
      <section className="flex flex-col items-center py-10 px-6 bg-white">
        <h2 className="text-3xl font-semibold mb-4">Get Started with Getting Feedback</h2>
        
        {/* Streamer Name Input */}
        <input
          type="text"
          value={streamerName}
          onChange={(e) => setStreamerName(e.target.value)}
          placeholder="Enter your streamer name here"
          className="mb-4 p-3 w-full max-w-md border rounded-md shadow-sm focus:outline-none"
        />

        {/* Feedback Option Selection */}
        <div className="flex flex-col items-start mb-6 w-full max-w-md">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={feedbackFromViewers}
              onChange={() => setFeedbackFromViewers(!feedbackFromViewers)}
              className="mr-2"
            />
            Feedback from your viewers
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={feedbackFromExternal}
              onChange={() => setFeedbackFromExternal(!feedbackFromExternal)}
              className="mr-2"
            />
            {/* (Coming Soon ) */}
            Feedback from external users or potential newcomers
          </label>
        </div>

        {/* Session Creation Button */}
        <div className="flex flex-col md:flex-row w-full max-w-4xl">
          <div className="flex-1 p-4 text-center border rounded-lg m-2 bg-gray-50">
            <p className="mb-4">Generate a session to start collecting feedback based on your selected option(s)</p>
            <button
              onClick={() => {
                if (!streamerName.trim()) {
                  alert('Please enter your streamer name.');
                  return;
                }
                createSession();
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-500 transition"
            >
              Generate Session
            </button>
            {sessionLink && (
              <div className="mt-3 text-blue-600">
                <p>Your session has been created: 
                <a href={sessionLink} target="_blank" rel="noopener noreferrer" className="underline">
                  {sessionLink}
                </a></p>
              </div>
            )}
            {error && <p className="text-red-500 mt-3">{error}</p>}
          </div>
        </div>
      </section>
      <section className="py-10 px-6 bg-gray-100">
        <h2 className="text-3xl font-semibold mb-6 text-center">How Does It Work?</h2>

        {/* Feedback with Viewers Steps */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10">
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md max-w-sm">
            <div className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full mb-4">
              1
            </div>
            <h3 className="text-xl text-center font-semibold mb-2">Select Feedback with Viewers</h3>
            <p className="text-center text-gray-700">
              Check the box for "Feedback from your viewers" under your username.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md max-w-sm">
            <div className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Generate Session</h3>
            <p className="text-center text-gray-700">
              Click "Generate Session" to create a unique chat link.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md max-w-sm">
            <div className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Share the Link</h3>
            <p className="text-center text-gray-700">
              Share the chat link with your viewers and invite them to give feedback.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md max-w-sm">
            <div className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full mb-4">
              4
            </div>
            <h3 className="text-xl font-semibold mb-2">Watch Your Dashboard Update</h3>
            <p className="text-center text-gray-700">
              As your viewers submit feedback, see your dashboard update the next day!
            </p>
          </div>
        </div>

        {/* Feedback with External Users Steps */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10">
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md max-w-sm">
            <div className="w-12 h-12 bg-green-500 text-white flex items-center justify-center rounded-full mb-4">
              1
            </div>
            <h3 className="text-xl text-center font-semibold mb-2">Select Feedback from External Users</h3>
            <p className="text-center text-gray-700">
              Check the box for "Feedback from external users" under your username.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md max-w-sm">
            <div className="w-12 h-12 bg-green-500 text-white flex items-center justify-center rounded-full mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Dashboard Updates</h3>
            <p className="text-center text-gray-700">
              Within 3-5 days, we’ll reach out, and you’ll see your dashboard updated with valuable insights.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="py-6 px-6 bg-white text-gray-600">
        <p>This is an ongoing research project at the University of Washington. By clicking any of the links above, you acknowledge that your feedback may be used for ongoing research to improve the StreamFeed platform. We collect and analyze feedback to better understand how streamers engage with their audiences. Your participation is voluntary, and all data will be anonymized to ensure your privacy.</p>
        <br/>
        <p>For questions, comments, or feedback, please contact: kmallari[at]uw[dot]edu</p>
      </footer>
    </div>
  );
};

export default Home;
