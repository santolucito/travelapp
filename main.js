document.getElementById('submitAPIKey').addEventListener("click", recordKey);


var apiKey = "";
var selectedModel = "gpt-3.5-turbo-1106";

var treeOfResponses = {};

function recordKey() {
  // Get the value entered in the text input
  apiKey = document.getElementById("input_APIKey").value;
}

document.getElementById('systemPrompt').value = "You are a tour guide speaking to a group of LENS. You generate lists of key points about a location of interest formatted as a JSON list of strings, where each string is one key point. As an example of the JSON format, use {\"Fact1\": \"Boston is a the capital of Massachusetts.\", \"Fact2\": \"Boston is the oldest city in Massachusetts.\"}"

document.getElementById('userFirstPrompt').value = "Generate five key points about POI. Focus on facts that would be interesting to LENS"

document.getElementById('userDetailsPrompt').value = "Generate five key facts that expand upon TOPIC. Focus on facts that would be interesting to LENS"

    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('submitButton').addEventListener('click', function() {
            var dropdown = document.getElementById('myDropdown');
            selectedModel= dropdown.value;
        });
    });

async function fetchDescriptions(lens, locationOfInterest) {
  travelQuery = document.getElementById('systemPrompt').value.replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);
  userPrompt = document.getElementById('userFirstPrompt').value.replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);

  let travelPrompt = {
    messages: [
      { role: "system", content: travelQuery },
      { role: "user", content: userPrompt }],
    model: selectedModel ,
    response_format: { type: "json_object" }
  };
  resp = await openAIFetchAPI(travelPrompt, 1, ".")
  console.log(resp)
  return JSON.parse(resp[0].message.content);
}

async function fetchDetails(lens, factToFocus) {
  travelQuery = document.getElementById('systemPrompt').value.replaceAll("LENS", lens).replaceAll("POI", locationOfInterest);
  userDetailsPrompt = document.getElementById('userFirstPrompt').value.replaceAll("LENS", lens).replaceAll("POI", lens).replaceAll("TOPIC", lens);

  let travelPrompt = {
    messages: [
      { role: "system", content: travelQuery },
      { role: "user", content: userDetailsPrompt }],
    model: selectedModel,
    response_format: { type: "json_object" }
  };
  resp = await openAIFetchAPI(travelPrompt, 1, ".")
  return JSON.parse(resp[0].message.content);
}

document.getElementById('generate').addEventListener('click', async () => {
  const lens = document.getElementById('lens').value;
  const locationOfInterest = document.getElementById('location').value;
  const descriptionsContainer = document.getElementById('descriptions');
  descriptionsContainer.innerHTML = '<p class="text-center">Loading...</p>';

  const descriptions = await fetchDescriptions(lens, locationOfInterest);
  treeOfResponses[locationOfInterest] = {}
  Object.values(descriptions).map(desc => treeOfResponses[locationOfInterest][desc] = {})
  renderTree(treeOfResponses, locationOfInterest)

});

async function openAIFetchAPI(prompt, numChoices) {
  if (apiKey == "test") {
    return [{'message':{'content':JSON.stringify({
      "Fact1": Math.random()*100, 
      "Fact2":  Math.random()*100,
      "Fact3":  Math.random()*100,
      "Fact4":  Math.random()*100,
      "Fact5":  Math.random()*100
    })}}]
  }
  console.log("Calling GPT4")
  const url = "https://api.openai.com/v1/chat/completions";
  const YOUR_TOKEN = apiKey //add your own openai api key
  const bearer = 'Bearer ' + YOUR_TOKEN
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


function getValueByKeyPath(tree, keyPath) {
  let current = tree;
  for (const key of keyPath) {
    current = current[key];
  }
  return current;
}

function setValueByKeyPath(tree, keyPath, newValue) {
  const parentPath = keyPath.slice(0, -1);
  const parent = getValueByKeyPath(tree, parentPath);

  if (parent) {
    const lastKey = keyPath[keyPath.length - 1];
    parent[lastKey] = newValue;
  }
}

function findKeyPath(tree, targetKey, currentPath = []) {
  for (const key in tree) {
    if (key === targetKey) {
      return [...currentPath, key];
    }

    if (typeof tree[key] === 'object') {
      const path = findKeyPath(tree[key], targetKey, [...currentPath, key]);
      if (path) {
        return path;
      }
    }
  }
  return null; // Key not found in the current subtree
}

document.getElementById('download').addEventListener('click', () => {
  var content = new Blob([JSON.stringify(treeOfResponses)], { type: 'text/plain' });
  var downloadLink = document.createElement('a');
  downloadLink.download = 'download.json';
  downloadLink.href = window.URL.createObjectURL(content);
  downloadLink.click();
  downloadLink.remove();
});

document.getElementById('pathDisplay').addEventListener('click', () => {
  currentFirstItem = document.getElementById('descriptions').querySelector('ul').getElementsByTagName('li')[0].innerText
  if (findKeyPath(treeOfResponses, currentFirstItem).length >= 3) {
    renderTree(treeOfResponses, findKeyPath(treeOfResponses, currentFirstItem).at(-3))
  }
});


function renderTree(tree, parentKey) {

  const ul = document.createElement('ul');
  ul.className = 'divide-y divide-gray-200';
  //assumes ever key in tree is unique
  parentKeyPath = findKeyPath(tree, parentKey);
  currentSubtree = getValueByKeyPath(tree, parentKeyPath)

  console.log(tree)
  console.log(treeOfResponses)
  console.log(parentKey)
  console.log(parentKeyPath)
  console.log(currentSubtree)

  for (const key in currentSubtree) {
    const li = document.createElement('li');
    li.className = 'p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100';
    li.textContent = key;
    li.onclick = async () => {
      const descriptionsContainer = document.getElementById('descriptions');
      descriptionsContainer.innerHTML = '<p class="text-center">Loading...</p>';

      if (currentSubtree[key] && Object.keys(currentSubtree[key]).length > 0) {
      }
      else {
        const descriptions = await fetchDescriptions(lens, key);
        Object.values(descriptions).map(desc => setValueByKeyPath(tree, parentKeyPath.concat(key, desc), {}))
      }
      renderTree(tree, key);
    };
    ul.appendChild(li);
  }

  const pathDisplay = document.getElementById('pathDisplay');
  pathDisplay.innerHTML = parentKeyPath

  const fileTree = document.getElementById('descriptions');
  fileTree.innerHTML = '';
  fileTree.appendChild(ul);
}
