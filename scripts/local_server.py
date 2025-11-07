
import http.server, socketserver, sys, os
PORT = int(sys.argv[1]) if len(sys.argv)>1 else 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving on http://localhost:{PORT}")
    httpd.serve_forever()
