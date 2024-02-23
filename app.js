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
  const { lens, topic, locationOfInterest, systemPrompt, userDetailsPrompt, model } = req.body;

  // Construct the payload for OpenAI API
  const travelQuery = systemPrompt.replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);
  const userPrompt = userDetailsPrompt.replaceAll("TOPIC", topic).replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);

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
    console.log(response.choices[0].message.content)
    res.json(response.choices[0].message.content);
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});