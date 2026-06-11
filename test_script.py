from fastapi.testclient import TestClient
from dashboard import app
import os

client = TestClient(app)

def test():
    # 1. Upload two small text files
    files1 = [
        ("files", ("test1.txt", b"content 1")),
        ("files", ("test2.txt", b"content 2")),
    ]
    resp1 = client.post("/api/upload", files=files1)
    data1 = resp1.json()
    sid1 = data1.get("session_id")
    docs1 = data1.get("uploadedDocuments")
    print(f"Session 1: {sid1}, Docs: {docs1}")

    # 3. Post /api/analyze
    resp_an1 = client.post("/api/analyze", json={"session_id": sid1})
    print(f"Analyze 1 OK: {resp_an1.status_code == 200}")

    # 4. Upload second request with one different file
    files2 = [
        ("files", ("test3.txt", b"content 3")),
    ]
    resp2 = client.post("/api/upload", files=files2)
    data2 = resp2.json()
    sid2 = data2.get("session_id")
    docs2 = data2.get("uploadedDocuments")
    print(f"Session 2: {sid2}, Docs: {docs2}")

    # 5. Prints results
    sessions_differ = (sid1 != sid2)
    resp1_exclusive = (len(docs1) == 2 and "test1.txt" in docs1 and "test2.txt" in docs1 and "test3.txt" not in docs1)
    resp2_exclusive = (len(docs2) == 1 and "test3.txt" in docs2 and "test1.txt" not in docs2)

    print(f"Sessions differ: {sessions_differ}")
    print(f"Response 1 exclusive: {resp1_exclusive}")
    print(f"Response 2 exclusive: {resp2_exclusive}")

if __name__ == "__main__":
    test()
