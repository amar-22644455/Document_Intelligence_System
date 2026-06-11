export async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Request failed');
  }
  return data;
}

export async function getJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  // let data is initialized as an empty object. This variable will hold the parsed JSON data from the response if the parsing is successful, or an object with a 'detail' property containing the raw text if parsing fails.
  // data type of let is flexible, it can hold any type of data (object, array, string, etc.) depending on the response from the backend.
  let data = {};

  if (text) {
    try {
      // We attempt to parse the response as JSON. (Raw text has been converted to JSON) 
      // If the response is not valid JSON,
      // we catch the error and instead create a simple object with a 'detail' property containing the raw text.
      // This way, we can still provide some feedback to the user even if the backend returns an unexpected response format.
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  // response is an object returned by the fetch API that contains information about the HTTP response, 
  // including the status code and the response body.
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Request failed');
  }
  // data here is the parsed JSON response from the backend, which we return to the caller.
  return data;
}

export async function postFormData(url, formData) {
  const response = await fetch(url, {
    method: 'POST',
    // ⚠️ CRITICAL: Do NOT set the 'Content-Type' header here!
    // The browser automatically sets it to 'multipart/form-data' 
    // and calculates the required boundary when you pass a FormData object.
    body: formData
  });

  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Upload failed');
  }
  return data;
}
