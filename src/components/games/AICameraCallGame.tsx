import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameSetupConfig, Question, AnswerLog } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../../utils/audio';
import { Users, Video, XCircle, Settings, ChevronRight, Hand, Trophy, FileSpreadsheet } from 'lucide-react';
import { useMediapipe } from '../../hooks/useMediapipe';
import { StudentImportButton } from '../StudentImportButton';
import { MathChemRenderer } from '../../utils/mathChemFormatter';

interface GameProps {
  config: GameSetupConfig;
  questions?: Question[];
  onGameEnd: (teams: any[], logs: AnswerLog[]) => void;
  themeType?: 'star' | 'galaxy' | 'nebula' | 'bubble';
}

const playMagicSound = (type: 'ting' | 'buzz' | 'select' | 'whoosh') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const playTone = (f: number, t: OscillatorType, d: number, v = 0.1, del = 0) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = t;
      o.frequency.setValueAtTime(f, audioCtx.currentTime + del);
      g.gain.setValueAtTime(v, audioCtx.currentTime + del);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + del + d);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(audioCtx.currentTime + del);
      o.stop(audioCtx.currentTime + del + d);
    };
    if (type === 'ting') {
      playTone(600, 'sine', 1);
      playTone(900, 'sine', 1, 0.1, 0.1);
      playTone(1200, 'sine', 1.5, 0.1, 0.2);
    } else if (type === 'buzz') {
      playTone(150, 'sawtooth', 0.5);
      playTone(120, 'sawtooth', 0.5, 0.1, 0.1);
    } else if (type === 'select') {
      playTone(800, 'triangle', 0.1);
    } else if (type === 'whoosh') {
      playTone(200, 'triangle', 1, 0.05);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const AICameraCallGame: React.FC<GameProps> = ({ config, questions = [], onGameEnd, themeType = 'star' }) => {
  const { ready } = useMediapipe();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const [students, setStudents] = useState<string[]>(config.studentsList && config.studentsList.length > 0 ? config.studentsList : ['An', 'Bình', 'Cường', 'Dũng', 'Em']);
  const [mode, setMode] = useState<'rollcall' | 'quiz'>('rollcall');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(-1);
  const [isAnswering, setIsAnswering] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string>('Đang chờ camera...');
  const [isStarted, setIsStarted] = useState(false);
  const [isEditingList, setIsEditingList] = useState(false);
  const [studentsText, setStudentsText] = useState(students.join('\n'));

  // Sync textarea
  useEffect(() => {
    const parsed = studentsText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    setStudents(parsed);
  }, [studentsText]);

  
  // Gesture tracking refs
  const handState = useRef({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
    present: false,
    gesture: -1,
    lastTriggered: -1,
    triggerTime: 0
  });

  // Particle System
  const particles = useRef<any[]>([]);
  const animationFrameId = useRef<number>(0);

  // Initialize Particles
  useEffect(() => {
    const initParticles = () => {
      particles.current = [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      
      if (themeType === 'star') {
        for (let i = 0; i < 800; i++) {
          particles.current.push({
            x: Math.random() * w, y: Math.random() * h,
            tx: 0, ty: 0,
            c: `hsl(${Math.random() * 50 + 40}, 100%, ${Math.random() * 40 + 50}%)`,
            s: Math.random() * 3 + 1,
            offset: Math.random() * Math.PI * 2
          });
        }
      } else if (themeType === 'galaxy') {
        students.forEach((name, i) => {
          particles.current.push({
            name, index: i, scaleFactor: Math.min(1, (Math.min(w,h)*0.45) / (80 + students.length*18)),
            angle: i * 0.6 + (Math.random()-0.5)*0.1,
            size: 55, hoverOffset: Math.random() * Math.PI * 2,
            x: 0, y: 0, hoverScale: 1
          });
        });
      } else if (themeType === 'nebula') {
        students.forEach(name => particles.current.push(createNebulaParticle(name, w, h)));
        const extra = 40 - particles.current.length;
        for(let i=0; i<extra; i++) particles.current.push(createNebulaParticle("", w, h));
      } else if (themeType === 'bubble') {
         students.forEach(name => particles.current.push(createBubbleParticle(name, w, h)));
      }
    };
    initParticles();
  }, [students, themeType]);
  
  const createNebulaParticle = (name: string, w: number, h: number) => ({
    name, x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
    size: 30 + Math.random() * 40, hue: Math.random() * 60 + 180, alpha: Math.random() * 0.5 + 0.3
  });
  
  const createBubbleParticle = (name: string, w: number, h: number) => ({
    name, x: Math.random() * w, y: h + Math.random() * h,
    vx: (Math.random() - 0.5), vy: -1 - Math.random() * 2,
    size: 40 + Math.random() * 20,
    popped: false
  });

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Bubble image for bubble theme
    const bubbleImg = new Image();
    bubbleImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC44KSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTI1IDMwIEEgMjUgMjUgMCAwIDEgNTAgMTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjgpIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==";
    
    const starImg = new Image();
    starImg.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZmZjMTA3IiBkPSJNMjU2IDguMWw3OC45IDE2MC42IDE3Ny4zIDI1LjgtMTI4LjMgMTI1IDMwLjMgMTc2LjYtMTU4LjItODMuMi0xNTguMiA4My4yIDMwLjMtMTc2LjYtMTI4LjMtMTI1IDE3Ny4zLTI1Ljh6Ii8+PHBhdGggZmlsbD0iI2ZmYTAwMCIgZD0iTTI1NiAyNy41bDY5LjYgMTQxLjYgMTU2LjMgMjIuNy0xMTMuMSAxMTAuMyAyNi43IDE1NS43LTEzOS41LTczLjRWMjcuNXoiLz48L3N2Zz4=";

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const time = Date.now();
      const st = handState.current;
      
      st.x += (st.targetX - st.x) * 0.1;
      st.y += (st.targetY - st.y) * 0.1;
      const hx = st.x * w;
      const hy = st.y * h;

      if (themeType === 'star') {
        ctx.fillStyle = 'rgba(5, 5, 16, 0.3)';
        ctx.fillRect(0, 0, w, h);
        const k = 5;
        particles.current.forEach((p, i) => {
          if (mode === 'rollcall') {
            const R = Math.min(w, h) * 0.35;
            const t = (i / 800) * Math.PI * 2;
            const starR = R * (1 + 0.3 * Math.cos(5 * t));
            p.tx = cx + starR * Math.cos(t) + (Math.random()-0.5)*20;
            p.ty = cy + starR * Math.sin(t) + (Math.random()-0.5)*20;
            
            // Effect when hand is present and fist
            if (st.present && st.gesture === 0) {
              p.tx = hx + (Math.random()-0.5)*100;
              p.ty = hy + (Math.random()-0.5)*100;
            }
          } else {
            const bookW = w * 0.6;
            const bookH = h * 0.5;
            p.tx = (w - bookW)/2 + Math.random() * bookW;
            p.ty = (h - bookH)/2 + Math.random() * bookH;
          }
          p.x += (p.tx - p.x) * 0.08;
          p.y += (p.ty - p.y) * 0.08;
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill();
        });
      } 
      else if (themeType === 'galaxy') {
        ctx.fillStyle = 'rgba(10, 5, 25, 0.2)';
        ctx.fillRect(0, 0, w, h);
        
        let centerX = hx;
        let centerY = hy;
        const waveInt = st.gesture === 0 ? 40 : 10;
        centerX += Math.sin(time * 0.0015) * waveInt + Math.cos(time * 0.0035) * (waveInt*0.5);
        centerY += Math.cos(time * 0.0025) * waveInt + Math.sin(time * 0.0045) * (waveInt*0.5);
        
        particles.current.forEach(p => {
           const currAngle = p.angle + time * 0.0001;
           const radius = (80 + p.index * 18) * p.scaleFactor;
           p.x = centerX + Math.cos(currAngle) * radius;
           p.y = centerY + Math.sin(currAngle) * radius;
           p.hoverScale = 1 + Math.sin(time * 0.003 + p.hoverOffset) * 0.08;
           
           if (p.x > -100 && p.x < w+100 && p.y > -100 && p.y < h+100) {
             const drawSize = p.size * p.hoverScale;
             ctx.save(); ctx.translate(p.x, p.y);
             ctx.shadowColor = "#f1c40f"; ctx.shadowBlur = 15;
             ctx.drawImage(starImg, -drawSize/2, -drawSize/2, drawSize, drawSize);
             if (p.name && mode === 'rollcall') {
               ctx.shadowBlur = 0; ctx.font = "bold 13px 'Arial', sans-serif";
               ctx.textAlign = "center"; ctx.textBaseline = "middle";
               const tw = ctx.measureText(p.name).width;
               ctx.fillStyle = "rgba(0,0,0,0.7)";
               ctx.beginPath(); ctx.roundRect(-tw/2-8, -12, tw+16, 24, 8); ctx.fill();
               ctx.fillStyle = "#fff"; ctx.fillText(p.name, 0, 1);
             }
             ctx.restore();
           }
        });
      }
      else if (themeType === 'nebula') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, w, h);
        particles.current.forEach(p => {
           if (!st.present) {
             p.vx += (Math.random() - 0.5) * 0.1;
             p.vy += (Math.random() - 0.5) * 0.1;
             p.vx *= 0.99; p.vy *= 0.99;
           } else {
             const dx = hx - p.x;
             const dy = hy - p.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             if (st.gesture === 0) {
               p.vx += dx * 0.05; p.vy += dy * 0.05;
               p.vx *= 0.9; p.vy *= 0.9;
             } else {
               p.vx += dx * 0.005; p.vy += dy * 0.005;
               if (dist < 200) { p.vx -= dx * 0.02; p.vy -= dy * 0.02; }
               p.vx *= 0.95; p.vy *= 0.95;
             }
           }
           p.x += p.vx; p.y += p.vy;
           if(p.x < -100) p.x = w + 100; if(p.x > w + 100) p.x = -100;
           if(p.y < -100) p.y = h + 100; if(p.y > h + 100) p.y = -100;
           
           ctx.save();
           const masterAlpha = mode === 'quiz' ? 0.1 : 1;
           const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
           grad.addColorStop(0, `hsla(${p.hue}, 100%, 80%, ${p.alpha * masterAlpha})`);
           grad.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
           ctx.fillStyle = grad;
           ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
           if (p.name && mode === 'rollcall') {
             ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * masterAlpha})`;
             ctx.font = "bold 14px 'Arial', sans-serif";
             ctx.textAlign = "center"; ctx.textBaseline = "middle";
             ctx.fillText(p.name, p.x, p.y);
           }
           ctx.restore();
        });
      }
      else if (themeType === 'bubble') {
        // Magical gradient background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        particles.current.forEach(p => {
          if (p.popped) return;
          p.x += p.vx;
          p.y += p.vy;
          // Wrap around top to bottom
          if (p.y < -100) {
            p.y = h + 100;
            p.x = Math.random() * w;
          }
          
          // Collision with hand (if pointing)
          if (st.present && st.gesture > 0) {
            const dx = hx - p.x;
            const dy = hy - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < p.size + 20) {
              p.popped = true;
              playMagicSound('ting');
              // We could trigger selection here, but we will let gesture logic handle it to avoid chaos
            }
          }
          
          const drawSize = p.size * 2;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.drawImage(bubbleImg, -drawSize/2, -drawSize/2, drawSize, drawSize);
          if (p.name && mode === 'rollcall') {
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px 'Arial', sans-serif";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(p.name, 0, 0);
          }
          ctx.restore();
        });
        
        // Auto respawn bubbles occasionally
        if (Math.random() < 0.01) {
           const unpopped = particles.current.filter(p => !p.popped);
           if (unpopped.length < students.length) {
              const p = particles.current.find(p => p.popped);
              if (p) {
                p.popped = false;
                p.y = h + 100;
                p.x = Math.random() * w;
              }
           }
        }
      }
      
      // Draw hand pointer on top
      if (st.present) {
         ctx.save();
         ctx.translate(hx, hy);
         ctx.beginPath();
         ctx.arc(0, 0, 10, 0, Math.PI*2);
         ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
         ctx.fill();
         ctx.shadowColor = '#00f6ff';
         ctx.shadowBlur = 20;
         ctx.strokeStyle = '#00f6ff';
         ctx.lineWidth = 3;
         ctx.stroke();
         
         ctx.fillStyle = '#fff';
         ctx.font = 'bold 16px Arial';
         ctx.fillText(`Cử chỉ: ${st.gesture === 0 ? 'Nắm' : st.gesture}`, 20, 0);
         ctx.restore();
      }

      animationFrameId.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [students, mode, themeType]);

  // Handle Logic Trigger
  const handleLogic = (gesture: number) => {
    if (mode === 'rollcall') {
      if (gesture === 5 || gesture === 0) {
        setSelectedStudents([]); // Reset on full open or fist
      } else if (gesture >= 1 && gesture <= 4 && selectedStudents.length === 0) {
        playMagicSound('ting');
        const count = Math.min(gesture, students.length);
        const picked = [...students].sort(() => Math.random() - 0.5).slice(0, count);
        setSelectedStudents(picked);
      }
    } else {
      if (gesture === 0) { // Next
        if (!isAnswering) {
          playMagicSound('whoosh');
          setCurrentQIndex(prev => prev + 1);
          setIsAnswering(true);
        }
      } else if ([1, 2, 3, 4].includes(gesture) && isAnswering) {
        // Answer logic
        const q = questions[currentQIndex];
        if (!q) return;
        const correctIndex = typeof q.correct === 'number' ? q.correct + 1 : 1;
        if (gesture === correctIndex) {
          playMagicSound('ting');
          soundFx.correct();
        } else {
          playMagicSound('buzz');
          soundFx.wrong();
        }
        setIsAnswering(false);
      }
    }
  };

  // AI Init
  useEffect(() => {
    if (!ready || !videoRef.current || !cameraCanvasRef.current || isStarted) return;
    setIsStarted(true);

    const initCamera = async () => {
      try {
        const wnd = window as any;
        const hands = new wnd.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        hands.onResults((res: any) => {
          const outCtx = cameraCanvasRef.current?.getContext('2d');
          if (outCtx && cameraCanvasRef.current) {
            outCtx.clearRect(0, 0, cameraCanvasRef.current.width, cameraCanvasRef.current.height);
            outCtx.drawImage(res.image, 0, 0, cameraCanvasRef.current.width, cameraCanvasRef.current.height);
            
            let count = -1;
            if (res.multiHandLandmarks && res.multiHandLandmarks.length > 0) {
              const lm = res.multiHandLandmarks[0];
              if (wnd.drawConnectors && wnd.HAND_CONNECTIONS) {
                wnd.drawConnectors(outCtx, lm, wnd.HAND_CONNECTIONS, { color: '#00cec9', lineWidth: 2 });
              }
              
              // Count fingers
              let c = 0;
              if (lm[8].y < lm[6].y) c++;
              if (lm[12].y < lm[10].y) c++;
              if (lm[16].y < lm[14].y) c++;
              if (lm[20].y < lm[18].y) c++;
              if (Math.abs(lm[4].x - lm[9].x) > 0.08) c++;
              if (c <= 1 && lm[8].y > lm[6].y) c = 0;
              if (c > 4) c = 5;
              count = c;
              
              handState.current.present = true;
              handState.current.targetX = 1 - lm[9].x; // mirror
              handState.current.targetY = lm[9].y;
            } else {
              handState.current.present = false;
            }
            
            if (count !== -1) {
              const now = Date.now();
              if (count !== handState.current.gesture) {
                handState.current.gesture = count;
                handState.current.triggerTime = now;
              } else if (now - handState.current.triggerTime > 400 && handState.current.gesture !== handState.current.lastTriggered) {
                handleLogic(count);
                handState.current.lastTriggered = count;
                handState.current.triggerTime = now;
              }
            } else {
               handState.current.lastTriggered = -1;
            }
          }
        });

        const camera = new wnd.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        
        await camera.start();
        setCameraStatus('Camera AI Đã Sẵn Sàng!');
      } catch (e) {
        console.error(e);
        setCameraStatus('Lỗi khởi tạo Camera AI. Vui lòng cấp quyền.');
      }
    };
    
    initCamera();
  }, [ready, isStarted, mode, students, selectedStudents, currentQIndex, isAnswering, questions]);

  // Window Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[100] text-white overflow-hidden font-sans">
      <video ref={videoRef} className="hidden" playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        
        {/* Header */}
        <header className="p-6 flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-3xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 drop-shadow-md">
              {themeType === 'star' ? 'NGÔI SAO TRI THỨC' : 
               themeType === 'galaxy' ? 'DẢI NGÂN HÀ' : 
               themeType === 'nebula' ? 'TINH VÂN HUYỀN BÍ' : 'BONG BÓNG TRI THỨC'}
            </h1>
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setMode('rollcall')}
                className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'rollcall' ? 'bg-cyan-500 text-black shadow-[0_0_15px_#00e5ff]' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                🔮 Gọi Tên
              </button>
              <button
                onClick={() => setMode('quiz')}
                className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'quiz' ? 'bg-cyan-500 text-black shadow-[0_0_15px_#00e5ff]' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                🧠 Câu Hỏi
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => onGameEnd([], [])}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-bold flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" /> Thoát
            </button>
            
            <StudentImportButton 
              onImport={(list) => {
                setStudents(list);
              }}
              variant="compact"
              buttonText="Nạp Danh Sách (Excel/Txt)"
              className="bg-green-600 hover:bg-green-500 text-white border-none !px-4 !py-2 !rounded-xl font-bold shadow-md"
            />
            
            <button
              onClick={() => setIsEditingList(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 text-sm shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" /> Sửa Danh Sách
            </button>
            <div className="text-xs text-slate-800 font-bold bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
              {students.length} Học sinh
            </div>
          </div>
        </header>

        <AnimatePresence>
          {isEditingList && (
            <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm pointer-events-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border-2 border-cyan-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl text-white"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-cyan-400">Chỉnh sửa danh sách học sinh</h3>
                  <button onClick={() => setIsEditingList(false)} className="text-slate-400 hover:text-white">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <textarea
                  className="w-full h-64 bg-slate-950 text-white p-3 rounded-xl border border-slate-700 focus:border-cyan-400 outline-none resize-none font-mono text-sm"
                  value={studentsText}
                  onChange={(e) => setStudentsText(e.target.value)}
                  placeholder="Mỗi dòng một tên học sinh..."
                />
                <button
                  onClick={() => setIsEditingList(false)}
                  className="w-full mt-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Xác nhận
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Instructions */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full text-cyan-300 font-medium border border-cyan-500/30 shadow-lg">
          {cameraStatus === 'Camera AI Đã Sẵn Sàng!' ? (
            mode === 'rollcall' ? 'Giơ 1, 2, 3, 4 ngón tay để gọi tương ứng số lượng HS. Nắm tay hoặc xòe 5 ngón để reset.' : 'Nắm tay để qua câu hỏi. Giơ 1, 2, 3 ngón tay để chọn đáp án A, B, C.'
          ) : cameraStatus}
        </div>

        {/* Camera Preview */}
        <div className="absolute bottom-6 right-6 w-48 h-36 bg-black border-2 border-cyan-500/50 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.2)] pointer-events-auto">
          <canvas ref={cameraCanvasRef} width={640} height={480} className="w-full h-full object-cover scale-x-[-1]" />
        </div>
        
        {/* Results Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl flex flex-wrap justify-center gap-6">
          <AnimatePresence>
            {mode === 'rollcall' && selectedStudents.map((name, idx) => (
              <motion.div
                key={name + idx}
                initial={{ scale: 0, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 12, delay: idx * 0.1 }}
                className="bg-gradient-to-br from-blue-600/90 to-purple-600/90 border-2 border-white/50 backdrop-blur-md text-white font-black text-4xl md:text-5xl px-8 py-6 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.6)]"
              >
                {name}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Quiz Overlay */}
        {mode === 'quiz' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-5xl">
            {currentQIndex === -1 ? (
              <div className="bg-slate-900/90 backdrop-blur-md p-10 rounded-3xl text-center border border-white/20 text-white">
                <h2 className="text-3xl font-bold mb-4 text-cyan-300">Sẵn sàng phần thi kiến thức!</h2>
                <p className="text-xl text-slate-300">Nắm bàn tay lại (0 ngón) để bắt đầu câu hỏi đầu tiên.</p>
              </div>
            ) : currentQIndex >= questions.length ? (
              <div className="bg-slate-900/90 backdrop-blur-md p-10 rounded-3xl text-center border border-white/20 text-white">
                <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-6" />
                <h2 className="text-4xl font-bold mb-4 text-yellow-400">Đã Hoàn Thành!</h2>
                <p className="text-xl text-slate-300">Tất cả câu hỏi đã được giải quyết.</p>
              </div>
            ) : (
              <div className="bg-white text-slate-900 p-8 rounded-3xl shadow-2xl border-4 border-slate-900/10">
                <div className="inline-block bg-rose-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-4 shadow-sm">
                  CÂU HỎI {currentQIndex + 1} / {questions.length}
                </div>
                <div className="text-3xl md:text-4xl font-black mb-8 leading-tight text-slate-900">
                  {questions[currentQIndex]?.content ? <MathChemRenderer text={questions[currentQIndex].content} /> : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    const q = questions[currentQIndex];
                    if (!q) return null;
                    const options = q.options && q.options.length > 0 ? q.options : ['Đúng', 'Sai'];
                    const correctIdx = typeof q.correct === 'number' ? q.correct : (q.correct === true ? 0 : 1);
                    return options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-6 rounded-2xl text-xl font-bold text-center border-4 transition-all ${
                          !isAnswering && idx === correctIdx
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-105'
                            : !isAnswering && idx !== correctIdx
                            ? 'bg-rose-600 border-rose-700 text-white opacity-60'
                            : 'bg-slate-100 border-slate-300 text-slate-800 shadow-inner'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm text-slate-900 font-black flex items-center justify-center mb-3 mx-auto text-sm shadow-xs">
                          {idx === 0 ? 'A (1)' : idx === 1 ? 'B (2)' : idx === 2 ? 'C (3)' : 'D (4)'}
                        </div>
                        <MathChemRenderer text={opt} />
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
