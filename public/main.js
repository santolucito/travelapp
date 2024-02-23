var apiKey = "";

var treeOfResponses = {};

document.getElementById('systemPrompt').value = "You are a tour guide speaking to a group of LENS. You generate lists of key points about a location of interest formatted as a JSON list of strings, where each string is one key point. As an example of the JSON format, use {\"Fact1\": \"Boston is a the capital of Massachusetts.\", \"Fact2\": \"Boston is the oldest city in Massachusetts.\"}"

document.getElementById('userFirstPrompt').value = "Generate five key points about POI. Focus on facts that would be interesting to LENS"

document.getElementById('userDetailsPrompt').value = "Generate five key facts that expand upon TOPIC. Focus on facts that would be interesting to LENS"

document.getElementById('generate').addEventListener('click', async () => {
  const lens = document.getElementById('lens').value;
  const locationOfInterest = document.getElementById('location').value;
  const systemPrompt = document.getElementById('systemPrompt').value;
  const userFirstPrompt = document.getElementById('userFirstPrompt').value;
  const selectedModel = document.getElementById('myDropdown').value;

  const descriptions = await fetchDescriptionsFromServer(lens, locationOfInterest, systemPrompt, userFirstPrompt, selectedModel);

  if (descriptions) {
    treeOfResponses[locationOfInterest] = {};
    Object.values(JSON.parse(descriptions)).forEach(desc => treeOfResponses[locationOfInterest][desc] = {});
    renderTree(treeOfResponses, locationOfInterest);
  }
});

function renderTree(tree, parentKey) {
  const ul = document.createElement('ul');
  ul.className = 'divide-y divide-gray-200';
  parentKeyPath = findKeyPath(tree, parentKey);
  currentSubtree = getValueByKeyPath(tree, parentKeyPath)

  console.log(currentSubtree);

  for (const key in currentSubtree) {
    console.log(key)
    const li = document.createElement('li');
    li.className = 'p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100';
    li.textContent = key;
    li.onclick = async () => {
      const descriptionsContainer = document.getElementById('descriptions');
      descriptionsContainer.innerHTML = '<p class="text-center">Loading...</p>';

      if (!(currentSubtree[key] && Object.keys(currentSubtree[key]).length > 0)) {
        // Fetch details from the server
        const descriptions = await fetchDetailsFromServer(key);
        console.log(JSON.parse(descriptions))
        Object.values(JSON.parse(descriptions)).map(desc => setValueByKeyPath(tree, parentKeyPath.concat(key, desc), {}));
      }
      renderTree(tree, key);
    };
    ul.appendChild(li);

    const pathDisplay = document.getElementById('pathDisplay');
    pathDisplay.innerHTML = parentKeyPath

    const fileTree = document.getElementById('descriptions');
    fileTree.innerHTML = '';
    fileTree.appendChild(ul);
  }
}

//navigate back up the tree
document.getElementById('pathDisplay').addEventListener('click', () => {
  currentFirstItem = document.getElementById('descriptions').querySelector('ul').getElementsByTagName('li')[0].innerText
  if (findKeyPath(treeOfResponses, currentFirstItem).length >= 3) {
    renderTree(treeOfResponses, findKeyPath(treeOfResponses, currentFirstItem).at(-3))
  }
});

//Download full log of interactions
document.getElementById('download').addEventListener('click', () => {
  var content = new Blob([JSON.stringify(treeOfResponses)], { type: 'text/plain' });
  var downloadLink = document.createElement('a');
  downloadLink.download = 'download.json';
  downloadLink.href = window.URL.createObjectURL(content);
  downloadLink.click();
  downloadLink.remove();
});


//server calls

async function fetchDescriptionsFromServer(lens, locationOfInterest, systemPrompt, userFirstPrompt, selectedModel) {

  const payload = {
    lens,
    locationOfInterest,
    systemPrompt,
    userFirstPrompt,
    model: selectedModel
  };

  try {
    const response = await fetch('/fetchDescriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Server responded with an error.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return null; // Or handle the error as appropriate for your application
  }
}

async function fetchDetailsFromServer(topic) {

  const lens = document.getElementById('lens').value;
  const locationOfInterest = document.getElementById('location').value;
  const systemPrompt = document.getElementById('systemPrompt').value;
  const userDetailsPrompt = document.getElementById('userDetailsPrompt').value;
  const selectedModel = document.getElementById('myDropdown').value;

  const payload = {
    lens,
    topic,
    locationOfInterest,
    systemPrompt,
    userDetailsPrompt,
    model: selectedModel
  };

  try {
    const response = await fetch('/fetchDetails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Server responded with an error.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}


//Tree helpers

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
