import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import OpenAI from "openai";
import fs from "fs";
import path from "path";

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

const publicPath = path.resolve('public');

app.post('/generate-audio', async (req, res) => {
  if (!req.body.text) {
    throw new Error('Text is required');
  }
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: req.body.text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const speechFile = path.join(publicPath, 'speech.mp3');
    await fs.promises.writeFile(speechFile, buffer);
    res.json(`/speech.mp3`);
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
