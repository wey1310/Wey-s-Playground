import React, { useState, useEffect } from 'react';
import { GameSetupConfig, Question, AnswerLog, Team } from '../../types';
import { soundFx } from '../../utils/audio';
import { Sparkles, Check, X, Shuffle, Trophy, Activity, Dumbbell, Award, Flame, RefreshCw } from 'lucide-react';

interface PoseChallengeGameProps {
  config: GameSetupConfig;
  questions: Question[];
  onGameEnd: (teams: Team[], logs: AnswerLog[]) => void;
}

// Available yoga pose images in /public/assets/games/yoga/
const POSE_IMAGES_LIST = [
  '/assets/games/yoga/yoga1.png',
  '/assets/games/yoga/yoga2.png',
  '/assets/games/yoga/yoga3.png',
  '/assets/games/yoga/yoga4.png',
  '/assets/games/yoga/yoga5.png',
  '/assets/games/yoga/yoga6.png',
  '/assets/games/yoga/yoga7.png',
  '/assets/games/yoga/yoga8.png',
  '/assets/games/yoga/yoga9.png',
  '/assets/games/yoga/yoga10.png',
];

const getPoseSvgFallback = (index: number) => {
  const poses = ['🧘‍♀️', '🤸‍♀️', '🧘‍♂️', '🤸‍♂️', '🏋️‍♀️', '🤾‍♀️', '🤺', '🤼‍♀️', '🏄‍♀️', '🧗‍♀️'];
  const poseEmoji = poses[index % poses.length];
  const colors = ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981'];
  const bg = colors[index % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="32" fill="${bg}"/>
    <circle cx="100" cy="100" r="60" fill="white" opacity="0.8"/>
    <text x="100" y="115" font-size="72" text-anchor="middle">${poseEmoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export function PoseChallengeGame({ config, questions, onGameEnd }: PoseChallengeGameProps) {
  // Teams
  const [teamsState, setTeamsState] = useState<Team[]>(
    config.teams && config.teams.length > 0
      ? config.teams
      : [
          { id: '1', name: 'Đội Đỏ', avatar: '🦁', color: '#ef4444', score: 0 },
          { id: '2', name: 'Đội Xanh', avatar: '🦄', color: '#3b82f6', score: 0 },
        ]
  );
  const [activeTeamIndex, setActiveTeamIndex] = useState<number>(0);
  const [logs, setLogs] = useState<AnswerLog[]>([]);

  // Questions state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [assignedPoses, setAssignedPoses] = useState<string[]>([]);

  // Selected answer & feedback state
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  const activeTeam = teamsState[activeTeamIndex] || teamsState[0];
  const currentQ = questions[currentQuestionIndex] || {
    id: 'default',
    type: 'mcq',
    content: 'Tư thế Yoga nào giúp tăng cường tính dẻo dai và tập trung tốt nhất?',
    options: ['Tư thế Cây tre (Lotus Tree)', 'Tư thế Chiến sĩ (Warrior)', 'Tư thế Chó úp mặt (Downward Dog)', 'Tư thế Con rắn (Cobra)'],
    correct: 0,
  };

  // Assign poses randomly to options whenever question changes
  useEffect(() => {
    const shuffled = [...POSE_IMAGES_LIST].sort(() => Math.random() - 0.5);
    setAssignedPoses(shuffled);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
  }, [currentQuestionIndex]);

  // Handle direct option click on main screen
  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOptionIndex(index);

    const isCorrect = index === Number(currentQ.correct);
    if (isCorrect) {
      soundFx.correct();
      const points = config.pointsPerCorrect || 100;
      setTeamsState((prev) =>
        prev.map((t, idx) => (idx === activeTeamIndex ? { ...t, score: t.score + points } : t))
      );
    } else {
      soundFx.wrong();
    }

    setLogs((prev) => [
      ...prev,
      {
        questionNumber: currentQuestionIndex + 1,
        questionText: currentQ.content,
        correctAnswer: String(currentQ.options?.[Number(currentQ.correct)] || currentQ.correct),
        teamName: activeTeam.name,
        isCorrect,
      },
    ]);

    // Delay 1.2s to show visual feedback then move to next turn/question
    setTimeout(() => {
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setActiveTeamIndex((prev) => (prev + 1) % teamsState.length);

      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 1200);
  };

  // Direct Teacher Manual Evaluation (without popup)
  const handleTeacherEvaluation = (isCorrect: boolean) => {
    if (isAnswered) return;
    setIsAnswered(true);

    if (isCorrect) {
      soundFx.correct();
      const points = config.pointsPerCorrect || 100;
      setTeamsState((prev) =>
        prev.map((t, idx) => (idx === activeTeamIndex ? { ...t, score: t.score + points } : t))
      );
    } else {
      soundFx.wrong();
    }

    setLogs((prev) => [
      ...prev,
      {
        questionNumber: currentQuestionIndex + 1,
        questionText: currentQ.content,
        correctAnswer: String(currentQ.options?.[Number(currentQ.correct)] || currentQ.correct),
        teamName: activeTeam.name,
        isCorrect,
      },
    ]);

    setTimeout(() => {
      setSelectedOptionIndex(null);
      setIsAnswered(false);
      setActiveTeamIndex((prev) => (prev + 1) % teamsState.length);

      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 1200);
  };

  const handleShufflePoses = () => {
    soundFx.buttonClick();
    const shuffled = [...POSE_IMAGES_LIST].sort(() => Math.random() - 0.5);
    setAssignedPoses(shuffled);
  };

  return (
    <div className="flex-1 min-h-0 w-full p-4 sm:p-6 bg-gradient-to-b from-emerald-100 via-teal-50 to-green-100 rounded-3xl shadow-2xl flex flex-col justify-between border-4 border-emerald-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/95 backdrop-blur p-4 rounded-2xl border-2 border-emerald-200 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl animate-bounce">🧘‍♀️</span>
          <div>
            <h2 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
              <span>Thử Thách Vận Động</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                Động tác đơn giản
              </span>
            </h2>
            <p className="text-xs text-emerald-800 font-medium">
              Làm động tác giống với ảnh gắn với đáp án bạn chọn ➔ Bấm chọn hoặc giáo viên chấm điểm!
            </p>
          </div>
        </div>

        {/* Team Scoreboard */}
        <div className="flex items-center gap-3">
          {teamsState.map((team, idx) => (
            <div
              key={team.id}
              className={`px-3.5 py-1.5 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-xs ${
                activeTeamIndex === idx
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-950 shadow-md scale-105 ring-2 ring-emerald-400/30'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <span className="text-base">{team.avatar}</span>
              <div>
                <div className="text-[11px] font-black">{team.name}</div>
                <div className="text-emerald-800 font-mono">{team.score}đ</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question & Options Area */}
      <div className="my-6 space-y-6 flex-1 flex flex-col justify-between">
        {/* Active Turn Indicator */}
        <div className="bg-white/95 border-2 border-emerald-300 p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeTeam.avatar}</span>
            <span className="text-sm font-black text-emerald-950">
              LƯỢT CHƠI CỦA: <span className="text-emerald-700">{activeTeam.name}</span>
            </span>
          </div>
          <div className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Câu {currentQuestionIndex + 1} / {questions.length || 1}
          </div>
        </div>

        {/* Question Card */}
        <div className="p-6 sm:p-10 bg-white/95 border-4 border-emerald-300 rounded-3xl shadow-2xl text-center space-y-6">
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-full uppercase tracking-wider border border-emerald-200">
            CÂU HỎI TƯ THẾ
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-emerald-950 leading-relaxed max-w-3xl mx-auto">
            {currentQ.content}
          </h3>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto pt-2">
            {(currentQ.options || ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D']).map((opt, idx) => {
              const poseImg = assignedPoses[idx % assignedPoses.length] || POSE_IMAGES_LIST[idx % POSE_IMAGES_LIST.length];
              const isCorrectOpt = idx === Number(currentQ.correct);
              const isSelected = selectedOptionIndex === idx;

              let btnStyle = 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-300 hover:border-emerald-500 hover:shadow-xl';
              if (selectedOptionIndex !== null) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-100 border-emerald-600 ring-2 ring-emerald-500 shadow-lg';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-100 border-rose-500 ring-2 ring-rose-400 shadow-lg';
                } else {
                  btnStyle = 'bg-slate-50 border-slate-200 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`group relative p-4 border-2 rounded-2xl shadow-md transition-all duration-300 text-left flex items-center gap-4 transform hover:-translate-y-1 ${btnStyle}`}
                >
                  <div className="relative shrink-0 w-20 h-20 bg-white rounded-xl border border-emerald-200 p-1 flex items-center justify-center shadow-inner overflow-hidden">
                    <img
                      src={poseImg}
                      alt={`Yoga Pose ${idx + 1}`}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getPoseSvgFallback(idx);
                      }}
                    />
                    <span className="absolute top-1 left-1 w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm font-black text-emerald-950 group-hover:text-emerald-800 truncate">
                      {opt}
                    </div>
                    {selectedOptionIndex !== null ? (
                      isCorrectOpt ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>ĐÚNG (+100đ)</span>
                        </div>
                      ) : isSelected ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-black text-rose-800 bg-rose-200 px-2.5 py-0.5 rounded-full border border-rose-400">
                          <X className="w-3.5 h-3.5 text-rose-700" />
                          <span>SAI</span>
                        </div>
                      ) : null
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-sm">
                        <Activity className="w-3 h-3 text-emerald-600" />
                        <span>Chấm điểm trực tiếp</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Teacher Direct Quick Grading Buttons */}
          <div className="pt-4 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/60 p-3 rounded-2xl">
            <span className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-emerald-600" />
              <span>GIÁO VIÊN CHẤM ĐIỂM TRỰC TIẾP:</span>
            </span>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                disabled={isAnswered}
                onClick={() => handleTeacherEvaluation(true)}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ĐÚNG (+100đ)</span>
              </button>
              <button
                disabled={isAnswered}
                onClick={() => handleTeacherEvaluation(false)}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>SAI (Mất Lượt)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="bg-white/95 border-2 border-emerald-300 p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <button
          onClick={handleShufflePoses}
          className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300 transition flex items-center gap-2"
        >
          <Shuffle className="w-4 h-4 text-emerald-700" />
          <span>Xáo Trộn Tư Thế</span>
        </button>

        <button
          onClick={() => onGameEnd(teamsState, logs)}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow transition flex items-center gap-1.5"
        >
          <Trophy className="w-4 h-4" />
          <span>Kết Thúc Game</span>
        </button>
      </div>
    </div>
  );
}
