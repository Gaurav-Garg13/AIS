/**
 * Controller for handling real-time AI Chatbot requests.
 * Supports both Google Gemini (default) and OpenAI APIs via native REST.
 */

// Helper to format conversation history for Gemini's API expectations.
// Gemini expects:
// 1. Alternating roles: 'user' and 'model'
// 2. Starts with the 'user' role
// 3. Consecutive messages of the same role are combined
const formatGeminiContents = (messages) => {
  const contents = [];
  
  for (const msg of messages) {
    const role = msg.role === 'bot' ? 'model' : 'user';
    
    // Gemini requires the first message to be from the 'user'
    if (contents.length === 0 && role === 'model') {
      contents.push({ role: 'user', parts: [{ text: "Hello!" }] });
    }

    const lastTurn = contents[contents.length - 1];
    if (lastTurn && lastTurn.role === role) {
      // Append text if consecutive roles are the same
      lastTurn.parts[0].text += "\n" + msg.text;
    } else {
      contents.push({
        role,
        parts: [{ text: msg.text }]
      });
    }
  }
  
  return contents;
};

export const generateResponse = async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const systemPrompt = "You are StudyFlow Assistant, a highly helpful, encouraging, and intelligent academic assistant embedded in the student's study dashboard. Keep your answers concise, engaging, and academic. You help with study planning, focus, exam preparation, and simple advice.";

    // 1. Try Google Gemini first if configured
    if (geminiKey) {
      try {
        const formattedContents = formatGeminiContents(messages);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return res.json({ reply: replyText });
          }
        } else {
          const errText = await response.text();
          console.warn("Gemini API failed with status:", response.status, errText, "Falling back to keyless AI provider...");
        }
      } catch (geminiError) {
        console.warn("Gemini request failed:", geminiError.message, "Falling back to keyless AI provider...");
      }
    }

    // 2. Try OpenAI next if configured
    if (openaiKey) {
      try {
        const formattedMessages = [
          { role: "system", content: systemPrompt },
          ...messages.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.text
          }))
        ];

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: formattedMessages
          })
        });

        if (response.ok) {
          const data = await response.json();
          const replyText = data.choices?.[0]?.message?.content;
          if (replyText) {
            return res.json({ reply: replyText });
          }
        } else {
          const errText = await response.text();
          console.warn("OpenAI API failed with status:", response.status, errText, "Falling back to keyless AI provider...");
        }
      } catch (openaiError) {
        console.warn("OpenAI request failed:", openaiError.message, "Falling back to keyless AI provider...");
      }
    }

    // 3. 100% Reliable Keyless Fallback (Pollinations AI)
    // This is triggered if Gemini/OpenAI are not configured OR if they hit rate limits/regional blocks (like Google's "limit: 0" error)
    console.log("Using Pollinations keyless AI engine...");
    const pollinationsResponse = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : 'user',
            content: msg.text
          }))
        ]
      })
    });

    if (pollinationsResponse.ok) {
      const replyText = await pollinationsResponse.text();
      if (replyText) {
        return res.json({ reply: replyText });
      }
    }

    // Ultimate fallback string if everything fails
    return res.json({ reply: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a few seconds!" });

  } catch (error) {
    console.error("Chatbot Controller Error:", error);
    res.status(500).json({ error: "Failed to generate AI response", details: error.message });
  }
};
