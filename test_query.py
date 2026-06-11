from fastapi.testclient import TestClient
from dashboard import app

client = TestClient(app)

# 1. Upload a sample text file
files = [
    ("files", ("sample.txt", b"This is a sample document about authentication and tokens.")),
]
resp = client.post("/api/upload", files=files)
print('upload status', resp.status_code, resp.text)
data = resp.json()
sid = data.get('session_id')
print('session', sid)

# 2. Analyze
resp2 = client.post('/api/analyze', json={'session_id': sid})
print('analyze', resp2.status_code, resp2.text)

# 3. Query the uploaded document
resp3 = client.post('/api/query', json={'session_id': sid, 'query': 'What is this document about?', 'target_file': 'sample.txt'})
print('query', resp3.status_code, resp3.text)

# 4. Compare (if multiple files) - skip

