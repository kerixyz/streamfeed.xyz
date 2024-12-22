import React from 'react';

const Research = () => {
  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 md:px-6 bg-white">
      
      {/* Hero Section */}
      <section className="w-full max-w-4xl text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">The Streamer's Guide to Constructive Feedback</h1>
        <p className="text-lg text-gray-700">
          At StreamFeed, we understand the challenges of getting valuable feedback. We’re here to help you get the most constructive insights to improve your streams!
        </p>
      </section>

      {/* Background Information Section */}
      <section className="w-full max-w-4xl mb-12">
        <h2 className="text-3xl font-semibold mb-6">Why We're Here</h2>
        <p className="text-gray-700 mb-4">
          We found that most streamers struggle with asking good feedback questions. They often focus on technical aspects like "How's my mic?" or "How's my audio?" and, if not technical, they usually ask broad questions like "Did you enjoy the stream?" or "How was it?"
        </p>
        <p className="text-gray-700 mb-4">
          On the other hand, viewers often don’t know how to provide useful feedback. They might respond with generic comments like "Great stream!" or "Enjoyed the stream," which can be vague and not actionable.
        </p>
        <p className="text-gray-700 mb-4">
          This is where we come in! Our goal is to provide you, the streamer, with constructive feedback that can help you reach your goals, whether it’s increasing engagement, improving content, or growing your community.
        </p>
      </section>

      {/* How Feedback with Viewers Works */}
      <section className="w-full max-w-4xl mb-12">
        <h2 className="text-3xl font-semibold mb-6">How Feedback with Viewers Works</h2>
        <p className="text-gray-700 mb-4">
          We use a series of structured questions that prompt viewers to share specific, justifiable, and actionable feedback. By guiding the conversation, we help you collect more meaningful insights.
        </p>
        <div className="w-full bg-gray-200 flex items-center justify-center rounded-md py-10">
          <span className="text-gray-500">[Visual Placeholder for Feedback with Viewers]</span>
        </div>
      </section>

      {/* Learn More Section */}
      <section className="w-full max-w-4xl mb-12">
        <h2 className="text-3xl font-semibold mb-6">Want to Learn More?</h2>
        <p className="text-gray-700 mb-4">
          Here’s some of the prior work that informed our approach. We’ve combined insights from various studies to help you get better feedback, faster.
        </p>

        {/* Placeholder for Prior Work Section */}
        <div className="mb-6">
          <h3 className="text-2xl font-semibold">Understanding Viewer Feedback Dynamics</h3>
          <p className="text-gray-700 mb-2">
            This study explored how streamers can better understand the types of feedback viewers provide and how to make it more useful.
          </p>
          {/* <a
            href="https://example.com/research1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Read more
          </a> */}
        </div>
      </section>
    </div>
  );
};

export default Research;
