export async function api(path, options = {}) {
 let response;
 try {
  response = await fetch('/api' + path, {...options, headers: {'Content-Type':'application/json', ...options.headers}, credentials:'same-origin'});
 } catch {
  throw new Error('Cannot reach the server. Start the project with npm.cmd start and try again.');
 }
 const text = await response.text();
 let data;
 try { data = text ? JSON.parse(text) : null; } catch { data = null; }
 if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
 if (!data || typeof data !== 'object') {
  throw new Error(response.status >= 500 || !text
   ? 'The backend is unavailable. Check the terminal for MySQL or backend startup errors.'
   : 'The server returned an invalid response. Check that the Node.js backend is running.');
 }
 if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.');
 return data;
}
