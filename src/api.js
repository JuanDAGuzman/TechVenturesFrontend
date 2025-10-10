const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';


export async function getAvailability(date, type) {
const res = await fetch(`${API}/availability?date=${date}&type=${type}`);
return res.json();
}


export async function createAppointment(payload) {
const res = await fetch(`${API}/appointments`, {
method: 'POST', headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(payload)
});
return res.json();
}


export async function setSaturdayWindows(date, ranges, adminToken) {
const res = await fetch(`${API}/admin/saturday-windows`, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
body: JSON.stringify({ date, ranges })
});
return res.json();
}