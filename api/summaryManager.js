const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
const bodyParser = require('body-parser');
const pool = require('./db'); 
const app = express();

require('dotenv').config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure the API key is set correctly in your environment
  });

async function generateSummaries(streamerName) {
    try {
      console.log(`Starting summary generation for streamer: ${streamerName}`);
  
      // Fetch messages for the streamer
      const result = await pool.query(
        'SELECT message FROM chat_messages WHERE streamer_name ILIKE $1',
        [streamerName]
      );
  
      const messages = result.rows.map(row => ({
        role: row.role, // 'user' or 'assistant'
        content: row.message,
      }));
      
      if (!messages.length) {
        console.log('No messages found for summarization.');
        return { error: 'No messages available for summarization.' };
      }
      
      console.log(`Fetched ${messages.length} messages for streamer: ${streamerName}`);
      
      // Create message text for the OpenAI prompt
      const messageText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      console.log('Prepared message text for OpenAI:', messageText);


      const prompt = `
        The following is a conversation between a bot and a user. The bot asks targeted questions to gather feedback about a livestreamer. 
        The user's responses are feedback about the streamer's content, engagement, and overall performance. Summarize the feedback into five categories. For each category, include direct quotes from the user's responses to support the summary.

        Messages:
        ${messageText}

        

        Do not include any surrounding code block markers in your response. For each summaries, try to generate at least two sentences long so it is lengthy and rich in information.
        Respond with a valid JSON object in the following format:

        {
        "why_viewers_watch": {
            "summary": "Summary of why viewers watch.",
            "quotes": [
            "Direct quote 1",
            "Direct quote 2"
            ]
          },
        "how_to_improve": {
            "summary": "Summary of how the streamer can improve.",
            "quotes": [
            "Direct quote 1",
            "Direct quote 2"
            ]
          },
        "content_production": {
            "summary": "Summary of feedback about content production.",
            "quotes": [
            "Direct quote 1",
            "Direct quote 2"
            ]
          },
        "community_management": {
            "summary": "Summary of feedback about community management.",
            "quotes": [
            "Direct quote 1",
            "Direct quote 2"
            ]
          },
        "marketing_strategy": {
            "summary": "Summary of feedback about marketing strategy.",
            "quotes": [
            "Direct quote 1",
            "Direct quote 2"
            ]
          }
        }
    `;

    console.log('Sending prompt to OpenAI:', prompt);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });

    try {
        // Step 1: Clean the response content
        const rawResponse = response.choices[0].message.content.trim();
      
        // Remove surrounding code block markers if they exist
        const cleanedResponse = rawResponse.replace(/^```json/, '').replace(/```$/, '').trim();
      
        // Step 2: Parse the cleaned response as JSON
        parsedResponse = JSON.parse(cleanedResponse);
      
        console.log('Parsed JSON Response:', parsedResponse);
      } catch (error) {
        console.error('Error parsing OpenAI response as JSON:', error.message);
        throw new Error('Failed to parse OpenAI response.');
      }
      

    // Validate the structure of the JSON
    const categories = ['why_viewers_watch', 'how_to_improve', 'content_production', 'community_management', 'marketing_strategy'];

    const summaries = {};
    const quotes = {};
    categories.forEach(category => {
    summaries[category] = parsedResponse[category]?.summary || 'No summary available';
    quotes[category] = parsedResponse[category]?.quotes?.join('\n') || 'No quotes available';
    });

    // Save the summaries and quotes to the database
    await pool.query(
    `INSERT INTO chat_summaries 
        (streamer_name, why_viewers_watch, how_to_improve, content_production, community_management, marketing_strategy,
        why_viewers_watch_quotes, how_to_improve_quotes, content_production_quotes, community_management_quotes, marketing_strategy_quotes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (streamer_name) 
        DO UPDATE SET 
        why_viewers_watch = $2, 
        how_to_improve = $3, 
        content_production = $4, 
        community_management = $5, 
        marketing_strategy = $6,
        why_viewers_watch_quotes = $7,
        how_to_improve_quotes = $8,
        content_production_quotes = $9,
        community_management_quotes = $10,
        marketing_strategy_quotes = $11`,
    [
        streamerName,
        summaries.why_viewers_watch,
        summaries.how_to_improve,
        summaries.content_production,
        summaries.community_management,
        summaries.marketing_strategy,
        quotes.why_viewers_watch,
        quotes.how_to_improve,
        quotes.content_production,
        quotes.community_management,
        quotes.marketing_strategy,
    ]
    );


    console.log(`Summaries successfully saved for streamer: ${streamerName}`);
    return summaries;
    } catch (error) {
        console.error(`Error generating summaries for streamer: ${streamerName}`, error);
        throw error;
    }
    }
  
  
  module.exports = { generateSummaries };