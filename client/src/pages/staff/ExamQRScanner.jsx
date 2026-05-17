import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { 
    Camera, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    RefreshCw, 
    UserCheck, 
    MapPin, 
    Clock, 
    Users, 
    Volume2, 
    VolumeX 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ExamQRScanner({ subjects }) {
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [scanning, setScanning] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannedLogs, setScannedLogs] = useState([]);
    
    const qrCodeInstanceRef = useRef(null);
    const scannerId = "exam-qr-reader-container";

    useEffect(() => {
        if (subjects && subjects.length > 0) {
            setSelectedSubjectId(subjects[0].subjectId);
        }
    }, [subjects]);

    // Synthesize a premium validation beep using the Web Audio API
    const playBeep = (type) => {
        if (!soundEnabled) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                // Happy high double beep
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.08);

                setTimeout(() => {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.frequency.setValueAtTime(800, ctx.currentTime);
                    gain2.gain.setValueAtTime(0.15, ctx.currentTime);
                    osc2.start(ctx.currentTime);
                    osc2.stop(ctx.currentTime + 0.12);
                }, 100);
            } else {
                // Low buzzer sound for failure
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.35);
            }
        } catch (e) {
            console.error("Audio Context beep failed", e);
        }
    };

    const startScanner = async () => {
        if (!selectedSubjectId) {
            return toast.error("Please select an active exam subject first.");
        }
        
        setScanning(true);
        setScanResult(null);

        setTimeout(() => {
            try {
                const html5QrCode = new Html5Qrcode(scannerId);
                qrCodeInstanceRef.current = html5QrCode;

                html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: (width, height) => {
                            const size = Math.min(width, height) * 0.7;
                            return { width: size, height: size };
                        }
                    },
                    (decodedText) => {
                        // Success scan callback
                        handleQrScanned(decodedText);
                    },
                    (errorMessage) => {
                        // Scan errors are frequent while pointing, quieten logs
                    }
                ).catch(err => {
                    console.error("Camera start failed:", err);
                    toast.error("Could not access environment camera. Make sure permissions are allowed.");
                    setScanning(false);
                });
            } catch (err) {
                console.error("Scanner setup failed:", err);
                setScanning(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
            try {
                await qrCodeInstanceRef.current.stop();
                qrCodeInstanceRef.current = null;
            } catch (err) {
                console.error("Stop scanner error:", err);
            }
        }
        setScanning(false);
    };

    const handleQrScanned = async (qrContent) => {
        // Stop scanning to process result
        await stopScanner();
        
        // Extract studentId from the verification URL inside QR
        // e.g., "http://localhost:5173/verify/hallticket/11c8d626-d621-4fa2-bf4f"
        let studentId = '';
        try {
            if (qrContent.includes('/verify/hallticket/')) {
                const parts = qrContent.split('/verify/hallticket/');
                studentId = parts[parts.length - 1];
            } else {
                // If it's a direct student UUID
                studentId = qrContent;
            }
        } catch (err) {
            playBeep('error');
            setScanResult({
                status: 'INVALID',
                message: 'Invalid QR Code scanned.'
            });
            return;
        }

        if (!studentId || studentId.length < 10) {
            playBeep('error');
            setScanResult({
                status: 'INVALID',
                message: 'Unrecognized Student ID hash.'
            });
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(`/staff/verify-scan/${studentId}`, {
                subjectId: selectedSubjectId
            });

            const data = res.data;
            const isCleared = data.dues?.cleared;

            if (isCleared && data.attendance?.marked) {
                playBeep('success');
                setScanResult({
                    status: 'SUCCESS',
                    student: data.student,
                    attendance: data.attendance,
                    dues: data.dues
                });

                // Add to session log list
                setScannedLogs(prev => [
                    {
                        id: Date.now().toString(),
                        studentName: data.student.name,
                        email: data.student.email,
                        className: data.student.className,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        status: 'SUCCESS'
                    },
                    ...prev
                ]);
            } else if (!isCleared) {
                playBeep('error');
                setScanResult({
                    status: 'BLOCKED',
                    student: data.student,
                    dues: data.dues
                });
                
                setScannedLogs(prev => [
                    {
                        id: Date.now().toString(),
                        studentName: data.student.name,
                        email: data.student.email,
                        className: data.student.className,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        status: 'BLOCKED'
                    },
                    ...prev
                ]);
            } else {
                playBeep('error');
                setScanResult({
                    status: 'BLOCKED',
                    student: data.student,
                    message: data.attendance?.error || 'Student not eligible for this exam.'
                });
            }
        } catch (err) {
            playBeep('error');
            setScanResult({
                status: 'INVALID',
                message: err.response?.data?.message || 'Verification request failed. Check server logs.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (qrCodeInstanceRef.current) {
                stopScanner();
            }
        };
    }, []);

    const selectedSubjectObj = subjects.find(s => s.subjectId === selectedSubjectId)?.subject;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header Settings */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="space-y-2 flex-1">
                    <label className="text-xs font-black uppercase tracking-widest text-primary block">
                        Select Exam Session Subject
                    </label>
                    <select
                        disabled={scanning}
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    >
                        <option value="">Choose examination subject...</option>
                        {subjects.map(sub => (
                            <option key={sub.subjectId} value={sub.subjectId}>
                                {sub.subject.code} - {sub.subject.name} (Sem {sub.subject.semester || 4})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`p-3.5 rounded-2xl border transition-all ${soundEnabled ? 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10' : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'}`}
                        title={soundEnabled ? "Mute scan feedback beep" : "Unmute scan feedback beep"}
                        aria-label={soundEnabled ? "Mute scan feedback beep" : "Unmute scan feedback beep"}
                    >
                        {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    {scanning ? (
                        <button
                            onClick={stopScanner}
                            className="px-6 py-3.5 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/20"
                        >
                            Stop Camera
                        </button>
                    ) : (
                        <button
                            onClick={startScanner}
                            className="px-6 py-3.5 premium-gradient text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg flex items-center gap-2"
                        >
                            <Camera className="w-5 h-5" />
                            Start QR Scanner
                        </button>
                    )}
                </div>
            </div>

            {/* Main Interactive Scanner Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* QR Scanner Screen Container */}
                <div className="relative glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl bg-slate-900/5 min-h-[350px] flex items-center justify-center">
                    {scanning && (
                        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
                            <div className="flex justify-between w-full">
                                <div className="w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl animate-pulse" />
                                <div className="w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl animate-pulse" />
                            </div>
                            {/* Scanning holographic line animation */}
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-bounce shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                            <div className="flex justify-between w-full">
                                <div className="w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl animate-pulse" />
                                <div className="w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl animate-pulse" />
                            </div>
                        </div>
                    )}

                    {!scanning && !scanResult && (
                        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce">
                                <Camera className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-700">Camera Feed Offline</h3>
                            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                                Select an active subject above and press the **Start QR Scanner** button to scan student hall tickets.
                            </p>
                        </div>
                    )}

                    {/* Camera Feed Target */}
                    <div 
                        id={scannerId} 
                        className={`w-full overflow-hidden transition-all duration-300 ${scanning ? 'block' : 'hidden'}`}
                    />

                    {/* Holographic Hologram Result Overlay */}
                    <AnimatePresence>
                        {scanResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 bg-white/95 backdrop-blur-md p-8 flex flex-col justify-center items-center text-center z-20 space-y-6"
                            >
                                {scanResult.status === 'SUCCESS' ? (
                                    <>
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20 text-emerald-500 animate-in zoom-in duration-300">
                                            <CheckCircle className="w-10 h-10 animate-bounce" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block border border-emerald-500/20">
                                                Dues Cleared & Verified
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-800 mt-2">{scanResult.student.name}</h2>
                                            <p className="text-xs text-muted-foreground font-mono">{scanResult.student.email}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 w-full max-w-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left">
                                            <div>
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Class / Section</div>
                                                <div className="text-xs font-black text-slate-700">{scanResult.student.className || 'N/A'}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Department</div>
                                                <div className="text-xs font-black text-slate-700">{scanResult.student.department || 'N/A'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 w-full max-w-sm animate-pulse justify-center">
                                            <UserCheck className="w-5 h-5 text-emerald-500" />
                                            <div className="text-xs font-bold text-left">
                                                <div>Present Logged: {scanResult.attendance.subjectCode}</div>
                                                <div className="text-[9px] font-medium opacity-80">{scanResult.attendance.date} • {scanResult.attendance.session} Session</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border-4 border-red-500/20 text-red-500 animate-in zoom-in duration-300">
                                            <XCircle className="w-10 h-10 animate-bounce" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] bg-red-500/10 text-red-600 px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block border border-red-500/20">
                                                ACCESS BLOCKED
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-800 mt-2">
                                                {scanResult.student?.name || 'Access Denied'}
                                            </h2>
                                            <p className="text-xs text-red-500 font-bold max-w-xs leading-relaxed mt-2">
                                                {scanResult.message || 'Dues Outstanding. Student is ineligible to attend the exam.'}
                                            </p>
                                        </div>

                                        {scanResult.dues && (
                                            <div className="w-full max-w-sm bg-red-50/50 border border-red-100 rounded-2xl p-4 text-left space-y-3">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-red-500">Dues Summary</div>
                                                {scanResult.dues.feeBalance > 0 && (
                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                                        <span>Outstanding Fees:</span>
                                                        <span className="text-red-500">₹{scanResult.dues.feeBalance}</span>
                                                    </div>
                                                )}
                                                {scanResult.dues.pendingSubjects.length > 0 && (
                                                    <div className="space-y-1.5 border-t border-red-100/50 pt-2">
                                                        <div className="text-[9px] text-muted-foreground font-bold">Unapproved Subjects:</div>
                                                        {scanResult.dues.pendingSubjects.map(sub => (
                                                            <div key={sub.code} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold font-mono">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                                {sub.code} - {sub.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                <button
                                    onClick={startScanner}
                                    className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Scan Next Student
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Session scan activity logs list */}
                <div className="glass rounded-[2.5rem] border border-white/10 p-8 shadow-2xl flex flex-col min-h-[350px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold">Session Check-In Activity</h3>
                            <p className="text-xs text-muted-foreground mt-1">Students checked in during this scan session</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-sm font-black font-mono">
                                {scannedLogs.filter(l => l.status === 'SUCCESS').length}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[250px] custom-scrollbar space-y-3 pr-2">
                        {scannedLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8 opacity-40 italic">
                                <Clock className="w-8 h-8 mb-2" />
                                <span className="text-xs">No active scans captured yet this session.</span>
                            </div>
                        ) : (
                            scannedLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                                        log.status === 'SUCCESS'
                                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-800'
                                            : 'bg-red-500/5 border-red-500/10 text-red-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                            log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            {log.status === 'SUCCESS' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-800">{log.studentName}</div>
                                            <div className="text-[9px] text-muted-foreground font-mono">{log.className || 'Student'} • {log.email}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold font-mono opacity-60">
                                        {log.time}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
