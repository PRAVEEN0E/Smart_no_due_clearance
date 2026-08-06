const fs = require('fs');
const path = require('path');
const os = require('os');

const FILES = [
    { name: 'sample.pdf', content: '%PDF-1.4 fake pdf content', mime: 'application/pdf' },
    { name: 'sample.doc', content: 'fake doc data', mime: 'application/msword' },
    { name: 'sample.docx', content: 'fake docx zip data', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'sample.ppt', content: 'fake ppt data', mime: 'application/vnd.ms-powerpoint' },
    { name: 'sample.pptx', content: 'fake pptx zip data', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    { name: 'sample.png', content: Buffer.from('89504e470d0a1a0a', 'hex'), mime: 'image/png' },
    { name: 'sample.jpg', content: Buffer.from('ffd8ffe000104a464946', 'hex'), mime: 'image/jpeg' },
    { name: 'sample.jpeg', content: Buffer.from('ffd8ffe000104a464946', 'hex'), mime: 'image/jpeg' },
    { name: 'sample.webp', content: 'RIFF....WEBPVP8 ', mime: 'image/webp' },
];

function makeMultipart(fields, filePath, filename, mimeType = 'application/octet-stream') {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
    const parts = [];
    for (const [k, v] of Object.entries(fields)) {
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`);
    }
    const fileBuf = fs.readFileSync(filePath);
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const head = Buffer.from(parts.join(''), 'utf8');
    const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
    return { body: Buffer.concat([head, fileBuf, tail]), boundary };
}

(async () => {
    const login = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'divyeshb606@gmail.com', password: '12345678' }), redirect: 'manual'
    });
    const cookie = login.headers.get('set-cookie').split(';')[0];
    if (!cookie) { console.log('LOGIN FAILED'); process.exit(1); }

    const results = [];
    for (const f of FILES) {
        const filePath = path.join(os.tmpdir(), f.name);
        fs.writeFileSync(filePath, f.content);
        try {
            const { body, boundary } = makeMultipart({ title: f.name, category: 'NOTES', subjectId: '2abe7743-6108-43a6-b207-5eaefad2ee41' }, filePath, f.name, f.mime);
            const up = await fetch('http://localhost:3000/api/materials', {
                method: 'POST',
                headers: { Cookie: cookie, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
                body
            });
            const upBody = await up.json();
            if (up.status !== 200) { results.push({ file: f.name, upload: up.status, err: upBody.message || JSON.stringify(upBody).slice(0, 80) }); continue; }

            const dl = await fetch(`http://localhost:3000/api/materials/${upBody.id}/download`, { headers: { Cookie: cookie }, redirect: 'manual' });
            const disposition = dl.headers.get('content-disposition') || '';
            const match = disposition.match(/filename="([^"]+)"/);
            results.push({ file: f.name, upload: up.status, storedName: upBody.originalName, mime: upBody.mimeType, downloadStatus: dl.status, fileName: match ? match[1] : '(none)', ok: match && match[1] === f.name });
        } catch (e) {
            results.push({ file: f.name, err: e.message });
        }
        fs.unlinkSync(filePath);
    }

    console.table(results.map(r => ({
        uploaded: r.file, stored: r.storedName, mime: r.mime, downloadedAs: r.fileName, status: r.upload === 200 ? (r.ok ? 'PASS' : 'FAIL') : r.err || 'FAIL'
    })));
    process.exit(0);
})();
