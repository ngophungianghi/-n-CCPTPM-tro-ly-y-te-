
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import { Message, Doctor } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatInterfaceProps {
  onSpecialtyDetected?: (text: string) => void;
  onBook: (doctor: Doctor, aiSummary?: string) => void;
  doctors: Doctor[]; // Nhận danh sách bác sĩ từ App
}

// Cập nhật Props để nhận summary cụ thể cho từng recommend
const RecommendedDoctorCard: React.FC<{ 
    doctor: Doctor; 
    onBook: (doctor: Doctor) => void; 
}> = ({ doctor, onBook }) => {
  return (
    <div className="mt-3 bg-white p-3 rounded-xl border border-teal-100 shadow-sm flex flex-col gap-2 max-w-[280px] animate-slide-up">
      <div className="flex gap-3">
          <img src={doctor.image || 'https://via.placeholder.com/100'} alt={doctor.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
          <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{doctor.name}</p>
              <p className="text-teal-600 text-xs truncate">{doctor.specialty}</p>
          </div>
      </div>
      <button 
        onClick={() => onBook(doctor)}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
          <Calendar size={14} />
          Đặt lịch ngay
      </button>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSpecialtyDetected, onBook, doctors }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'model',
      text: "Xin chào, tôi là trợ lý y tế AI.\nĐể bắt đầu, vui lòng cho tôi biết **triệu chứng khó chịu nhất** của bạn là gì?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const { text, recommendedDoctorIds, summary } = await sendMessageToGemini(userMsg.text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        timestamp: new Date(),
        recommendedDoctorIds,
        aiSummary: summary // Lưu summary từ AI trả về
      };
      setMessages(prev => [...prev, botMsg]);
      if (onSpecialtyDetected) onSpecialtyDetected(text);
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Lỗi kết nối AI. Thử lại sau!", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLastUserSymptoms = () => {
    const userMsgs = messages.filter(m => m.role === 'user');
    return userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].text : "Không có thông tin chi tiết.";
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} className="min-h-[1.4em]">
           {parts.map((part, j) => part.startsWith('**') ? <strong key={j} className="font-bold text-slate-800">{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>)}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-teal-50/50 p-4 border-b border-slate-100 flex items-center gap-3">
        <Bot size={24} className="text-teal-700" />
        <h2 className="font-bold text-slate-800">Tư vấn sức khỏe AI</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-teal-600' : 'bg-white border shadow-sm'}`}>
              {msg.role === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-teal-600"/>}
            </div>
            <div className="max-w-[80%]">
              <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white border shadow-sm'}`}>
                {renderText(msg.text)}
              </div>
              
              {/* Render Recommended Doctor Card if available */}
              {msg.recommendedDoctorIds?.map(id => {
                const doc = doctors.find(d => d.id === id);
                return doc ? (
                    <RecommendedDoctorCard 
                        key={id} 
                        doctor={doc} 
                        // Ưu tiên dùng summary do AI sinh ra (msg.aiSummary), nếu không có mới dùng fallback
                        onBook={(d) => onBook(d, msg.aiSummary || `Triệu chứng chính: ${getLastUserSymptoms()}`)} 
                    />
                ) : null;
              })}
            </div>
          </div>
        ))}
        {isLoading && <Loader2 className="animate-spin text-teal-600 mx-auto" />}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <div className="relative">
          <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Nhập triệu chứng..." className="w-full bg-slate-100 rounded-xl py-3 pl-4 pr-12 outline-none focus:ring-2 focus:ring-teal-500" />
          <button onClick={handleSendMessage} className="absolute right-2 top-1.5 p-2 bg-teal-600 text-white rounded-lg"><Send size={18}/></button>
        </div>
      </div>
    </div>
  );
};
