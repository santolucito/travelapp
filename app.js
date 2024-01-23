import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' directory

app.post('/fetchDescriptions', async (req, res) => {
  const { lens, locationOfInterest, systemPrompt, userFirstPrompt, model } = req.body;

  // Construct the payload for OpenAI API
  const travelQuery = systemPrompt.replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);
  const userPrompt = userFirstPrompt.replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);

  let travelPrompt = {
    messages: [
      { role: "system", content: travelQuery },
      { role: "user", content: userPrompt }
    ],
    model: model,
    response_format: { type: "json_object" }
  };

  console.log(travelPrompt)

  // Call the OpenAI API
  try {
    const response = await openai.chat.completions.create(travelPrompt)
    res.json(response.choices[0].message.content);
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message });
  }
});

app.post('/fetchDetails', async (req, res) => {
    const { lens, topic, locationOfInterest, systemPrompt, userDetailsPrompt, selectedModel } = req.body;
    
    // Construct the payload for OpenAI API
    const travelQuery = systemPrompt.replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);
    const userPrompt = userDetailsPrompt.replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);
  
    let travelPrompt = {
      messages: [
        { role: "system", content: travelQuery },
        { role: "user", content: userPrompt }
      ],
      model: model,
      response_format: { type: "json_object" }
    };
  
    // Call the OpenAI API
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(travelPrompt)
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      const data = await response.json();
      res.json(data.choices);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });