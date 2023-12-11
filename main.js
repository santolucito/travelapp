document.getElementById('submitAPIKey').addEventListener("click", recordKey);


var apiKey = "";

function recordKey() {
  // Get the value entered in the text input
  apiKey = document.getElementById("input_APIKey").value;
}

document.getElementById('systemPrompt').value = "You are a tour guide speaking to a group of LENS. You generate lists of key points about a location of interest formatted as a JSON list of strings, where each string is one key point. As an example of the JSON format, use {\"Fact1\": \"Boston is a the capital of Massachusetts.\", \"Fact2\": \"Boston is the oldest city in Massachusetts.\"}"

document.getElementById('userFirstPrompt').value = "Generate five key points about POI. Focus on facts that would be interesting to LENS"

document.getElementById('userDetailsPrompt').value = "Generate five key facts that expand upon FACT. Focus on facts that would be interesting to LENS"

async function fetchDescriptions(lens, locationOfInterest) {
  travelQuery = document.getElementById('systemPrompt').value.replace("LENS", lens);
  userPrompt = document.getElementById('userFirstPrompt').value.replace("LENS", lens).replace("POI", locationOfInterest);

  console.log(travelQuery)
  console.log(userPrompt)
  let travelPrompt = {
    messages: [
      { role: "system", content: travelQuery },
      { role: "user", content: userPrompt }],
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" }
  };
  resp = await openAIFetchAPI(travelPrompt, 1, ".")
  console.log(resp)
  return JSON.parse(resp[0].message.content);
}

async function fetchDetails(lens, factToFocus) {
  travelQuery = document.getElementById('systemPrompt').value.replace("LENS", lens);
  userDetailsPrompt = document.getElementById('userFirstPrompt').value.replace("LENS", lens).replace("POI", lens).replace("FACT", lens);

  let travelPrompt = {
    messages: [
      { role: "system", content: travelQuery },
      { role: "user", content: userDetailsPrompt }],
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" }
  };
  resp = await openAIFetchAPI(travelPrompt, 1, ".")
  console.log(resp)
  return JSON.parse(resp[0].message.content);
}

document.getElementById('generate').addEventListener('click', async () => {
  const lens = document.getElementById('lens').value;
  const locationOfInterest = document.getElementById('location').value;
  const descriptionsContainer = document.getElementById('descriptions');
  descriptionsContainer.innerHTML = '<p class="text-center">Loading...</p>';

  const descriptions = await fetchDescriptions(lens, locationOfInterest);
  descriptionsContainer.innerHTML = Object.values(descriptions).map(desc =>
    `<p class="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100">${desc}</p>`
  ).join('');
});

// Event delegation for clicking on descriptions to generate more content
document.getElementById('descriptions').addEventListener('click', async event => {
  const lens = document.getElementById('lens').value;
  console.log(event.target.innerText)
  const factToFocus = event.target.innerText;
  const descriptionsContainer = document.getElementById('descriptions');
  descriptionsContainer.innerHTML = '<p class="text-center">Loading...</p>';

  const descriptions = await fetchDescriptions(lens, factToFocus);
  descriptionsContainer.innerHTML = Object.values(descriptions).map(desc =>
    `<p class="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100">${desc}</p>`
  ).join('');
});

async function openAIFetchAPI(prompt, numChoices) {
  console.log("Calling GPT4")
  const url = "https://api.openai.com/v1/chat/completions";
  const YOUR_TOKEN = apiKey //add your own openai api key
  const bearer = 'Bearer ' + YOUR_TOKEN
  console.log(prompt)
  const data = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': bearer,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(prompt)
  }).then(response => {
    return response.json()
  });
  return data['choices'];
}
