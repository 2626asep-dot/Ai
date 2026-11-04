# NEXORA AI

Starter aplikasi chatbot NEXORA AI. SPCK Editor dipakai untuk mengedit frontend; backend Node.js dan SQLite harus dijalankan pada komputer/server yang mendukung Node.js.

## Menjalankan backend

1. Instal Node.js 18 atau lebih baru pada komputer/server.
2. Buka folder proyek di terminal.
3. Jalankan `npm install`.
4. Salin `.env.example` menjadi `.env`.
5. Isi `OPENAI_API_KEY` dengan API key milikmu. Jangan pernah memasukkan key ke `public/app.js`, HTML, atau membagikan file `.env`.
6. Jalankan `npm start`.
7. Buka alamat server yang ditampilkan.

## Mengedit di SPCK Android

Ekstrak ZIP lalu buka folder `public` atau edit `public/index.html`, `public/style.css`, dan `public/app.js` di SPCK. Untuk benar-benar mengirim pesan ke AI, frontend harus di-host bersama backend atau diarahkan ke backend yang sudah online. SPCK sendiri bukan server Node.js.

## API key

Buat API key di dashboard penyedia model AI. Untuk OpenAI: https://platform.openai.com/api-keys
Penggunaan API ditagih terpisah dari langganan ChatGPT. Periksa billing, harga model, dan batas penggunaan sebelum dipakai.

## Catatan

Ini starter project, belum dilengkapi autentikasi pengguna, pembatasan request, moderasi lanjutan, streaming token, maupun deployment. Tambahkan autentikasi/rate limit sebelum membuka ke publik. Jangan commit `.env`.


## Penting: Preview SPCK Editor

Preview SPCK hanya menyajikan file frontend statis; ia tidak menjalankan `server.js`, Node.js, atau file `.env`. Karena itu chat tidak akan bekerja hanya dengan menempelkan API key ke proyek SPCK.

Agar chat berfungsi:
1. Deploy folder proyek (backend `server.js`, `package.json`, dan folder `public`) ke hosting Node.js yang mendukung persistent storage untuk SQLite.
2. Atur environment variable `OPENAI_API_KEY` di pengaturan hosting, bukan di frontend.
3. Jalankan `npm install` dan `npm start` pada hosting.
4. Pastikan endpoint `https://ALAMAT-BACKEND/api/config` bisa dibuka dan menunjukkan `configured: true`.
5. Buka `public/config.js` di SPCK dan isi `window.NEXORA_API_BASE = "https://ALAMAT-BACKEND";` (tanpa garis miring di akhir).
6. Simpan lalu muat ulang Preview SPCK.

Jangan gunakan `localhost` sebagai URL backend dari HP/Preview kecuali server memang berjalan pada perangkat yang sama dan dapat dijangkau. Jangan pernah menaruh API key di `config.js`, `app.js`, atau HTML.


## Troubleshooting HTTP 404 / Unexpected token E

Jika muncul `Unexpected token 'E' ... Error 404 ... is not valid JSON`, URL API mengarah ke alamat yang tidak menyediakan endpoint backend. Kode frontend versi FIX3 kini menampilkan pesan HTTP yang lebih jelas, tetapi 404 tetap harus diselesaikan dengan mengatur `window.NEXORA_API_BASE` pada `public/config.js` ke URL backend Node.js yang benar dan sudah online. Uji `https://URL-BACKEND/api/config`; hasil yang benar adalah JSON seperti `{"configured":true,"model":"gpt-4.1-mini"}`. Jika halaman 404 atau HTML, backend belum terpasang/berjalan pada alamat tersebut.


## Deploy Render (Web Service)

This project includes `render.yaml` for Render Blueprint deployment. Upload the entire project folder to a GitHub repository, then in Render choose **New > Blueprint** and connect that repository. Render reads `render.yaml`; enter `OPENAI_API_KEY` when prompted. Alternatively choose **New > Web Service**, then set Build Command `npm install`, Start Command `npm start`, and environment variables `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-4.1-mini`.

After deployment, copy the Render service URL (for example `https://nexora-ai-backend.onrender.com`) into `public/config.js` as `window.NEXORA_API_BASE = "https://YOUR-SERVICE.onrender.com";`, then commit/push that change if you host the frontend from GitHub, or edit the file locally in SPCK and refresh Preview.

The backend enables CORS for the SPCK preview and limits API requests. For a public production app, replace `ALLOWED_ORIGIN=*` with your exact frontend origin and add user authentication/quotas. Render Free web services spin down after inactivity and their local filesystem is ephemeral; SQLite chat history may be lost on restart/redeploy. Use a persistent datastore (e.g. Postgres) for durable history. OpenAI API usage is billed separately from ChatGPT subscriptions.
