#!/usr/bin/env python3
"""
Simple HTTP server for serving the V3Labs frontend.
"""
import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 3000

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)

def main():
    """Start the frontend server."""
    os.chdir(Path(__file__).parent)
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 V3Labs Frontend Server")
        print(f"📡 Serving at: http://localhost:{PORT}")
        print(f"📁 Directory: {Path(__file__).parent}")
        print(f"🔗 Backend API: http://localhost:8000")
        print(f"\n💡 Make sure the V3Labs backend is running on port 8000")
        print(f"⚡ Opening browser...")
        
        # Open browser
        webbrowser.open(f'http://localhost:{PORT}')
        
        print(f"\n🛑 Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n✅ Server stopped")

if __name__ == "__main__":
    main()