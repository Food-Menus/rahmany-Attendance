// server.js - سيرفر وسيط يعمل على الشبكة المحلية
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const IP = '0.0.0.0'; // يستمع على كل الواجهات الشبكية

// تخزين بيانات الحضور في الذاكرة
let attendanceRecords = [];

const server = http.createServer((req, res) => {
    // إضافة CORS headers للسماح بأي جهاز على الشبكة
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // معالجة preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // endpoint: استقبال بصمة جديدة (POST)
    if (req.method === 'POST' && req.url === '/api/attendance') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const record = JSON.parse(body);
                const enrichedRecord = {
                    ...record,
                    id: Date.now(),
                    receivedAt: new Date().toISOString(),
                    serverReceived: true
                };
                attendanceRecords.unshift(enrichedRecord);
                console.log('✅ استلمت بصمة جديدة:', enrichedRecord.name);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'تم تسجيل البصمة', id: enrichedRecord.id }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'بيانات غير صالحة' }));
            }
        });
    }
    
    // endpoint: سحب كل البصمات (GET)
    else if (req.method === 'GET' && req.url === '/api/attendance') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, records: attendanceRecords }));
    }
    
    // endpoint: حذف بصمة معينة (DELETE)
    else if (req.method === 'DELETE' && req.url.startsWith('/api/attendance/')) {
        const id = parseInt(req.url.split('/').pop());
        const initialLength = attendanceRecords.length;
        attendanceRecords = attendanceRecords.filter(record => record.id !== id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true, 
            message: `تم حذف ${initialLength - attendanceRecords.length} سجل` 
        }));
    }
    
    // endpoint: مسح كل البصمات (DELETE)
    else if (req.method === 'DELETE' && req.url === '/api/attendance') {
        attendanceRecords = [];
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'تم مسح جميع السجلات' }));
    }
    
    // endpoint: معلومات السيرفر
    else if (req.method === 'GET' && req.url === '/api/info') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            server: 'Attendance System Server',
            version: '1.0',
            totalRecords: attendanceRecords.length,
            status: 'running'
        }));
    }
    
    // صفحة ترحيبية بسيطة
    else if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head><title>Attendance Server</title></head>
            <body style="font-family: Arial; text-align: center; margin-top: 50px;">
                <h1>✅ سيرفر إدارة الحضور يعمل</h1>
                <p>عدد البصمات المسجلة: ${attendanceRecords.length}</p>
                <p>API Endpoints:</p>
                <ul style="display: inline-block; text-align: left;">
                    <li>GET /api/attendance - سحب كل البصمات</li>
                    <li>POST /api/attendance - إرسال بصمة جديدة</li>
                    <li>DELETE /api/attendance - مسح كل البصمات</li>
                    <li>GET /api/info - معلومات السيرفر</li>
                </ul>
            </body>
            </html>
        `);
    }
    
    // 404
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API غير موجود' }));
    }
});

server.listen(PORT, IP, () => {
    console.log(`🚀 سيرفر الحضور يعمل على:`);
    console.log(`   - http://localhost:${PORT}`);
    console.log(`   - http://[جهازك IP]:${PORT}`);
    console.log(`📱 يمكن لأي جهاز على نفس الشبكة الاتصال بهذا السيرفر`);
});