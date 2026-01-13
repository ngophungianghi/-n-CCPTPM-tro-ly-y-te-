
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, AlertTriangle, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Message, Doctor } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { MOCK_DOCTORS } from '../constants';

interface ChatInterfaceProps {
  onSpecialtyDetected?: (text: string) => void;
  onBook: (doctor: Doctor) => void;
}

// Mini Doctor Card for Chat
const RecommendedDoctorCard: React.FC<{ doctorId: string; onBook: (doctor: Doctor) => void }> = ({ doctorId, onBook }) => {
  const doctor = MOCK_DOCTORS.find(d => d.id === doctorId);
  if (!doctor) return null;

  return (
    <div className="mt-3 bg-white p-3 rounded-xl border border-teal-100 shadow-sm flex flex-col gap-2 max-w-[280px]">
      <div className="flex gap-3">
          <img src={doctor.image} alt={doctor.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
          <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{doctor.name}</p>
              <p className="text-teal-600 text-xs truncate">{doctor.specialty}</p>
          </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
          <Clock size={12} className="text-green-600" />
          <span>Trống: <span className="font-medium text-green-700">{doctor.nextAvailable}</span></span>
      </div>
      <button 
        onClick={() => onBook(doctor)}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
          <Calendar size={14} />
          Đặt lịch ngay
          <ArrowRight size={12} className="opacity-80"/>
      </button>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSpecialtyDetected, onBook }) => {
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
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const { text, recommendedDoctorIds } = await sendMessageToGemini(userMessage.text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date(),
        recommendedDoctorIds: recommendedDoctorIds
      };

      setMessages(prev => [...prev, botMessage]);

      if (onSpecialtyDetected) {
          onSpecialtyDetected(text);
      }

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Xin lỗi, đã có lỗi xảy ra khi kết nối. Vui lòng thử lại sau.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={i} className={`min-h-[1.4em] ${line.trim().startsWith('-') ? 'ml-4' : ''}`}>
           {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
           })}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
      
      {/* Soft Header */}
      <div className="bg-gradient-to-r from-teal-50 to-white p-4 border-b border-slate-100 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2 rounded-2xl">
            <Bot size={24} className="text-teal-700" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 leading-tight">Trợ Lý Sức Khỏe</h2>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-xs text-slate-500 font-medium">Đang trực tuyến</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
           <AlertTriangle size={12} className="text-amber-500" />
           <p className="text-[10px] text-amber-700 font-medium uppercase tracking-wide">Sàng lọc, không chẩn đoán</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border
                ${msg.role === 'user' ? 'bg-blue-600 border-blue-600' : 'bg-white border-white'}`}>
              {msg.role === 'user' ? 
                <User size={16} className="text-white" /> : 
                <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="AI" className="w-full h-full object-cover rounded-full" />
              }
            </div>
            
            <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
                {/* Bubble */}
                <div
                className={`px-5 py-3.5 shadow-sm text-sm sm:text-[15px] leading-relaxed
                    ${msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-white text-slate-600 border border-slate-100 rounded-2xl rounded-tl-sm'}`}
                >
                {renderText(msg.text)}
                </div>

                {/* Recommendations (if any) */}
                {msg.recommendedDoctorIds && msg.recommendedDoctorIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1 animate-fade-in-up">
                        {msg.recommendedDoctorIds.map(id => (
                            <RecommendedDoctorCard key={id} doctorId={id} onBook={onBook} />
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <div className={`text-[10px] opacity-50 px-1
                    ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                 <img src="https://cdn-icons-png.flaticon.com/512/4712/4712035.png" alt="AI" className="w-full h-full object-cover rounded-full opacity-50" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
        <div className="relative max-w-4xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập triệu chứng của bạn tại đây..."
            disabled={isLoading}
            className="w-full bg-slate-50 border-0 text-slate-800 rounded-2xl pl-5 pr-14 py-4 shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all placeholder-slate-400 disabled:opacity-60"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-200"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
