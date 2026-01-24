
import React, { useState, useEffect, useMemo } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { DoctorList } from './components/DoctorList';
import { 
  Home as HomeIcon, MessageSquare, Stethoscope, History, User as UserIcon,
  LogOut, ChevronRight, ChevronDown, Calendar, Phone, X, CheckCircle,
  ArrowRight, Loader2, Trash2, Clock, Settings, Plus, Edit, Briefcase,
  Search, Filter, Lock, Info, Camera, HelpCircle, Check, Users as UsersIcon, Link as LinkIcon,
  AlertCircle, LayoutDashboard, TrendingUp, CalendarCheck, XCircle,
  Shield, Zap, Activity, Star, Award, HeartPulse, Bot, FileText, UserPlus,
  CalendarDays, CalendarClock, CheckCircle2, RefreshCcw, MapPin, AlertTriangle
} from 'lucide-react';
import { Doctor, User, Booking, Specialty, AvailableSlot } from './types';
import { 
  fetchDoctors, saveBooking, fetchUserBookings, updateBookingStatus, 
  fetchAllBookings, saveDoctor, deleteDoctor, registerUser, loginUser,
  checkAvailability, fetchAllUsers, uploadDoctorImage, updateUserRole
} from './services/databaseService';
import { initializeChat } from './services/geminiService';

type Page = 'home' | 'chat' | 'doctors' | 'history' | 'auth' | 'admin' | 'doctor_dashboard';
type AuthMode = 'login' | 'register';
type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const TIME_OPTIONS = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];

const NavBtn = ({active, icon, label, onClick}: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }} 
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
  >
    {icon} <span className="hidden lg:inline">{label}</span>
  </button>
);

const ToastContainer = ({ toasts, removeToast }: { toasts: ToastMessage[], removeToast: (id: number) => void }) => {
  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`pointer-events-auto min-w-[300px] max-w-sm bg-white p-4 rounded-2xl shadow-xl border-l-4 flex items-start gap-3 animate-slide-up
            ${toast.type === 'success' ? 'border-teal-500' : toast.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}
        >
          <div className={`mt-0.5 ${toast.type === 'success' ? 'text-teal-500' : toast.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <Info size={18} />}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-sm ${toast.type === 'success' ? 'text-teal-700' : toast.type === 'error' ? 'text-red-700' : 'text-blue-700'}`}>
              {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi' : 'Thông báo'}
            </h4>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
        </div>
      ))}
    </div>
  );
};

// --- NEW BOOKING CARD DESIGN (TICKET STYLE) ---
const BookingCard: React.FC<{ 
  booking: Booking; 
  onCancel?: (id: string) => void;
  onRebook?: (doctorName: string) => void; 
}> = ({ booking, onCancel, onRebook }) => {
  const dateParts = booking.date.split('-'); // YYYY-MM-DD
  const day = dateParts[2];
  const month = dateParts[1];
  const year = dateParts[0];

  const statusConfig = {
    'Chờ khám': { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock, label: 'Đang xử lý' },
    'Đã xác nhận': { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: CheckCircle2, label: 'Đã xác nhận' },
    'Đã hoàn thành': { color: 'text-green-600 bg-green-50 border-green-100', icon: Award, label: 'Hoàn thành' },
    'Đã hủy': { color: 'text-red-500 bg-red-50 border-red-100', icon: XCircle, label: 'Đã hủy' }
  };

  const config = statusConfig[booking.status] || statusConfig['Chờ khám'];
  const StatusIcon = config.icon;

  return (
    <div className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden animate-slide-up flex flex-col md:flex-row">
      {/* Date Block - Ticket Stub Look */}
      <div className="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-6 flex flex-col items-center justify-center min-w-[100px] gap-1 group-hover:bg-teal-50/50 transition-colors">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tháng {month}</span>
        <span className="text-4xl font-black text-slate-800">{day}</span>
        <span className="text-slate-400 text-xs font-semibold">{year}</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col justify-between gap-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
             <div className="relative">
                <img src={booking.doctorImage || 'https://via.placeholder.com/100'} className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm" alt={booking.doctorName} />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                   <div className="bg-teal-500 w-2.5 h-2.5 rounded-full border border-white"></div>
                </div>
             </div>
             <div>
               <h4 className="font-bold text-lg text-slate-800 leading-tight">{booking.doctorName}</h4>
               <p className="text-xs text-teal-600 font-bold uppercase tracking-wide mt-1">{booking.specialty}</p>
               <div className="flex items-center gap-2 mt-2 text-slate-500 text-sm">
                  <Clock size={14} className="text-slate-400"/>
                  <span className="font-semibold">{booking.time}</span>
               </div>
             </div>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${config.color}`}>
             <StatusIcon size={14} />
             <span className="text-[11px] font-black uppercase">{config.label}</span>
          </div>
        </div>

        {/* AI Summary Section */}
        {booking.aiSummary && (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
             <div className="flex items-center gap-2 mb-1">
                <Bot size={14} className="text-purple-500"/>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ghi chú AI</span>
             </div>
             <p className="text-xs text-slate-600 italic line-clamp-2">"{booking.aiSummary}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-2 border-t border-dashed border-slate-100">
           {(booking.status === 'Chờ khám' || booking.status === 'Đã xác nhận') && onCancel && (
             <button 
                onClick={() => onCancel(booking.id)} 
                className="text-xs font-bold text-red-400 hover:text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
             >
               <Trash2 size={14} /> Hủy lịch hẹn
             </button>
           )}
           {booking.status === 'Đã hoàn thành' && onRebook && (
             <button onClick={() => onRebook(booking.doctorId)} className="text-xs font-bold text-teal-600 hover:text-teal-700 py-2 px-4 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-2">
               <RefreshCcw size={14} /> Tái khám
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, colorClass }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, description, colorClass, onClick }: any) => (
  <div onClick={onClick} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorClass}`}>{icon}</div>
    <h3 className="text-xl font-black text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    <div className="mt-6 flex items-center text-sm font-bold text-slate-900 gap-2 group-hover:gap-3 transition-all"> Khám phá <ArrowRight size={16} /></div>
  </div>
);

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<User | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<'bookings' | 'doctors' | 'users'>('bookings');
  const [editingDoctor, setEditingDoctor] = useState<Partial<Doctor> | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [adminSelectedDate, setAdminSelectedDate] = useState<string>('');
  const [pendingDoctor, setPendingDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [bookingSummary, setBookingSummary] = useState<string>('');
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // State for Cancellation Modal
  const [cancelModalData, setCancelModalData] = useState<{show: boolean, bookingId: string | null}>({show: false, bookingId: null});
  const [isCancelling, setIsCancelling] = useState(false);

  // New State for History Tabs
  const [historyTab, setHistoryTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 6);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    const init = async () => {
      const docs = await fetchDoctors();
      setDoctors(docs);
      await initializeChat(docs);
      const savedUser = localStorage.getItem('care_ai_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        const userBks = await fetchUserBookings(u.phone);
        setBookings(userBks);
        if (u.role === 'doctor') {
            setCurrentPage('doctor_dashboard');
            refreshAdminData(); 
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if ((user?.role === 'admin' && currentPage === 'admin') || (user?.role === 'doctor' && currentPage === 'doctor_dashboard')) {
        refreshAdminData();
    }
  }, [currentPage, user]);

  useEffect(() => {
    if (pendingDoctor && bookingDate) {
        setBookingTime('');
        checkAvailability(pendingDoctor.id, bookingDate).then(setOccupiedSlots);
    }
  }, [bookingDate, pendingDoctor]);

  const refreshAdminData = async () => {
    const [b, d, u] = await Promise.all([fetchAllBookings(), fetchDoctors(), fetchAllUsers()]);
    setAllBookings(b);
    setDoctors(d);
    setAllUsers(u);
    await initializeChat(d);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target as any;
    const phone = form.phone.value;
    const password = form.password.value;
    try {
        if (authMode === 'register') {
            const fullName = form.fullName.value;
            const role = phone === '000' ? 'admin' : 'customer';
            const newUser: User = { phone, fullName, password, username: phone, role };
            if (await registerUser(newUser)) {
                setUser(newUser);
                localStorage.setItem('care_ai_user', JSON.stringify(newUser));
                const userBks = await fetchUserBookings(phone);
                setBookings(userBks);
                setCurrentPage(role === 'admin' ? 'admin' : 'home');
                addToast("Đăng ký thành công!", "success");
            } else addToast("SĐT đã tồn tại!", "error");
        } else {
            const u = await loginUser(phone, password);
            if (u) {
                setUser(u);
                localStorage.setItem('care_ai_user', JSON.stringify(u));
                const userBks = await fetchUserBookings(phone);
                setBookings(userBks);
                if (u.role === 'admin') setCurrentPage('admin');
                else if (u.role === 'doctor') { setCurrentPage('doctor_dashboard'); refreshAdminData(); }
                else setCurrentPage('home');
                addToast(`Chào mừng ${u.fullName}!`, "success");
            } else addToast("Sai SĐT hoặc mật khẩu!", "error");
        }
    } catch (err) { addToast("Lỗi kết nối!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const promoteToDoctor = async (phone: string) => {
    if (await updateUserRole(phone, 'doctor')) { addToast("Cấp quyền thành công!", "success"); refreshAdminData(); }
    else addToast("Lỗi cấp quyền!", "error");
  };

  const toggleSlot = (date: string, time: string) => {
    if (!editingDoctor) return;
    const currentSlots = editingDoctor.availableSlots || [];
    const exists = currentSlots.find(s => s.date === date && s.time === time);
    const newSlots = exists ? currentSlots.filter(s => !(s.date === date && s.time === time)) : [...currentSlots, { date, time }];
    setEditingDoctor({ ...editingDoctor, availableSlots: newSlots });
  };

  const onSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor?.name || !editingDoctor?.specialty) return addToast("Điền đủ thông tin!", "error");
    await saveDoctor(editingDoctor as Doctor);
    await refreshAdminData();
    setShowDocModal(false);
    setEditingDoctor(null);
    addToast("Lưu thành công!", "success");
  };

  const executeDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      await deleteDoctor(id);
      setDoctors(prev => prev.filter(d => d.id !== id));
      setAllBookings(prev => prev.filter(b => b.doctorId !== id));
      setConfirmDeleteId(null);
      addToast("Đã xóa bác sĩ.", "success");
    } catch (e) { addToast("Lỗi xóa!", "error"); }
    finally { setIsDeletingId(null); }
  };

  const stats = useMemo(() => ({
    totalBookings: allBookings.length,
    completedBookings: allBookings.filter(b => b.status === 'Đã hoàn thành').length,
    totalUsers: allUsers.length,
    totalDoctors: doctors.length
  }), [allBookings, allUsers, doctors]);

  const doctorBookings = useMemo(() => {
    if (user?.role !== 'doctor') return [];
    const profile = doctors.find(d => (d.userPhone && d.userPhone === user.phone) || d.name.includes(user.fullName));
    return profile ? allBookings.filter(b => b.doctorId === profile.id) : [];
  }, [allBookings, user, doctors]);

  const availableDatesForDoctor = useMemo(() => {
    if (!pendingDoctor) return [];
    const dates = (pendingDoctor.availableSlots || []).filter(s => s.date >= todayStr).map(s => s.date);
    return Array.from(new Set(dates)).sort();
  }, [pendingDoctor, todayStr]);

  const availableTimesForDate = useMemo(() => {
    if (!pendingDoctor || !bookingDate) return [];
    return (pendingDoctor.availableSlots || []).filter(s => s.date === bookingDate).map(s => s.time).sort();
  }, [pendingDoctor, bookingDate]);

  const isPast = (date: string) => date < todayStr;
  const filteredAdminBookings = allBookings.filter(b => !isPast(b.date) || b.status !== 'Chờ khám');

  // Logic to Filter History Bookings based on Tab
  const filteredUserBookings = useMemo(() => {
    return bookings.filter(b => {
      if (historyTab === 'upcoming') return b.status === 'Chờ khám' || b.status === 'Đã xác nhận';
      if (historyTab === 'completed') return b.status === 'Đã hoàn thành';
      if (historyTab === 'cancelled') return b.status === 'Đã hủy';
      return true;
    });
  }, [bookings, historyTab]);

  const handleRebook = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
        setPendingDoctor(doctor);
        setBookingSummary("Tái khám theo lịch cũ");
        setBookingDate('');
        setBookingTime('');
        setShowBookingModal(true);
    } else {
        addToast("Bác sĩ này hiện không khả dụng", "error");
    }
  };

  // --- NEW: Handle Cancel Booking Logic ---
  const handleOpenCancelModal = (id: string) => {
    setCancelModalData({ show: true, bookingId: id });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalData.bookingId || !user) return;
    
    setIsCancelling(true);
    try {
        const success = await updateBookingStatus(cancelModalData.bookingId, 'Đã hủy');
        if (success) {
            addToast("Đã hủy lịch hẹn thành công.", "success");
            // Important: Refresh local state
            const updatedBookings = await fetchUserBookings(user.phone);
            setBookings(updatedBookings);
            // Switch to Cancelled tab so user sees the change
            setHistoryTab('cancelled');
        } else {
            addToast("Không thể hủy lịch. Vui lòng thử lại.", "error");
        }
    } catch (error) {
        addToast("Lỗi hệ thống khi hủy.", "error");
    } finally {
        setIsCancelling(false);
        setCancelModalData({ show: false, bookingId: null });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div onClick={() => setCurrentPage(user?.role === 'doctor' ? 'doctor_dashboard' : 'home')} className="flex items-center gap-3 cursor-pointer">
            <div className="bg-slate-900 p-2 rounded-xl text-white"><Stethoscope size={24} /></div>
            <span className="font-black text-2xl tracking-tighter">CareAI</span>
          </div>
          <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-xl">
             {user?.role === 'doctor' ? (
                <NavBtn active={currentPage === 'doctor_dashboard'} onClick={() => setCurrentPage('doctor_dashboard')} icon={<Activity size={18}/>} label="Ca trực của tôi"/>
             ) : (
                <>
                    <NavBtn active={currentPage === 'home'} onClick={() => setCurrentPage('home')} icon={<HomeIcon size={18}/>} label="Trang chủ"/>
                    <NavBtn active={currentPage === 'chat'} onClick={() => setCurrentPage('chat')} icon={<MessageSquare size={18}/>} label="Tư vấn AI"/>
                    <NavBtn active={currentPage === 'doctors'} onClick={() => setCurrentPage('doctors')} icon={<Briefcase size={18}/>} label="Bác sĩ"/>
                    <NavBtn active={currentPage === 'history'} onClick={() => setCurrentPage('history')} icon={<History size={18}/>} label="Lịch sử"/>
                    {user?.role === 'admin' && <NavBtn active={currentPage === 'admin'} onClick={() => setCurrentPage('admin')} icon={<Settings size={18}/>} label="Admin"/>}
                </>
             )}
          </div>
          <button onClick={() => { if(user) { setUser(null); localStorage.removeItem('care_ai_user'); setCurrentPage('home'); addToast("Đã đăng xuất.", "info"); } else setCurrentPage('auth'); }} className="text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl transition-all">
            {user ? (<><div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white">{user.fullName[0]}</div> <span className="hidden sm:inline">{user.role === 'doctor' ? 'BS. ' : ''}{user.fullName}</span><LogOut size={18}/></>) : (<div className="flex items-center gap-2"><UserIcon size={18} /><span>Đăng nhập</span></div>)}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 mt-4">
        {currentPage === 'home' && (
            <div className="animate-fade-in space-y-10">
                <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-500/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                          <span className="text-teal-400 text-xs font-bold uppercase tracking-wider">Hệ thống Y tế thông minh 4.0</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">Chăm sóc sức khỏe <br/> <span className="text-teal-400">chủ động & toàn diện</span></h1>
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-lg">Kết nối với bác sĩ chuyên khoa hàng đầu, chẩn đoán sơ bộ bằng AI và đặt lịch khám nhanh chóng. Trải nghiệm y tế không chờ đợi.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => setCurrentPage('chat')} className="bg-teal-500 text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg shadow-teal-500/20"><Zap size={20}/> Tư vấn AI ngay</button>
                            <button onClick={() => setCurrentPage('doctors')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/20 transition-all"><Search size={20}/> Tìm bác sĩ</button>
                        </div>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <FeatureCard icon={<Bot size={28}/>} title="Chẩn đoán AI" description="Sử dụng AI để phân tích triệu chứng, gợi ý chuyên khoa và đưa ra lời khuyên y tế tức thì." colorClass="bg-teal-100 text-teal-600" onClick={() => setCurrentPage('chat')} />
                    <FeatureCard icon={<CalendarCheck size={28}/>} title="Đặt lịch 1 chạm" description="Tra cứu lịch rảnh bác sĩ theo thời gian thực. Đặt lịch khám nhanh chóng, tiết kiệm thời gian." colorClass="bg-blue-100 text-blue-600" onClick={() => setCurrentPage('doctors')} />
                    <FeatureCard icon={<Activity size={28}/>} title="Hồ sơ sức khỏe" description="Lưu trữ lịch sử khám bệnh, dễ dàng theo dõi tình trạng sức khỏe cá nhân mọi lúc mọi nơi." colorClass="bg-purple-100 text-purple-600" onClick={() => setCurrentPage('history')} />
                </div>
            </div>
        )}

        {currentPage === 'chat' && <div className="h-[75vh]"><ChatInterface doctors={doctors} onBook={(d, summary) => { setPendingDoctor(d); setBookingSummary(summary || ''); setBookingDate(''); setBookingTime(''); if(!user) setCurrentPage('auth'); else setShowBookingModal(true); }} /></div>}
        {currentPage === 'doctors' && <div className="h-[75vh]"><DoctorList doctors={doctors} onBook={(d, summary) => { setPendingDoctor(d); setBookingSummary(summary || ''); setBookingDate(''); setBookingTime(''); if(!user) setCurrentPage('auth'); else setShowBookingModal(true); }} /></div>}

        {currentPage === 'history' && (
            <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Hồ sơ sức khỏe</h2>
                        <p className="text-slate-500 mt-2">Quản lý lịch khám và theo dõi hành trình sức khỏe.</p>
                    </div>
                    
                    {/* NEW: Tab Selector */}
                    <div className="flex p-1.5 bg-slate-200/50 rounded-xl">
                        {[
                          { id: 'upcoming', label: 'Sắp tới', icon: CalendarClock },
                          { id: 'completed', label: 'Hoàn thành', icon: CheckCircle2 },
                          { id: 'cancelled', label: 'Đã hủy', icon: XCircle }
                        ].map(tab => (
                           <button
                             key={tab.id}
                             onClick={() => setHistoryTab(tab.id as any)}
                             className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                               historyTab === tab.id 
                               ? 'bg-white text-teal-700 shadow-sm' 
                               : 'text-slate-500 hover:bg-white/50'
                             }`}
                           >
                              <tab.icon size={16} />
                              <span className="hidden sm:inline">{tab.label}</span>
                           </button>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {filteredUserBookings.length > 0 ? (
                        filteredUserBookings.map(b => (
                          <BookingCard 
                            key={b.id} 
                            booking={b} 
                            onCancel={handleOpenCancelModal} 
                            onRebook={handleRebook}
                           />
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <CalendarDays size={32} />
                            </div>
                            <p className="text-slate-400 font-bold">Chưa có lịch hẹn nào trong mục này.</p>
                            {historyTab === 'upcoming' && (
                                <button onClick={() => setCurrentPage('doctors')} className="mt-4 text-teal-600 font-bold text-sm hover:underline">
                                    + Đặt lịch khám mới
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}

        {currentPage === 'doctor_dashboard' && user?.role === 'doctor' && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center bg-teal-600 text-white p-8 rounded-[3rem] shadow-xl">
                    <div><h2 className="text-3xl font-black">Xin chào, {user.fullName}</h2><p className="opacity-90 mt-2">Chúc bác sĩ một ngày làm việc hiệu quả!</p></div>
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm"><CalendarCheck size={32} /></div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {doctorBookings.map(b => (
                        <div key={b.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4"><div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-500">{b.userFullName[0]}</div><div><h4 className="font-bold text-lg">{b.userFullName}</h4><p className="text-slate-400 text-sm">{b.userPhone}</p></div></div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${b.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' : b.status === 'Đã xác nhận' ? 'bg-blue-100 text-blue-600' : b.status === 'Đã hủy' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{b.status}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4"><div className="flex items-center gap-2"><Calendar size={16} className="text-teal-600" /><span className="text-sm">{b.date.split('-').reverse().join('/')}</span></div><div className="flex items-center gap-2"><Clock size={16} className="text-teal-600" /><span className="text-sm">{b.time}</span></div></div>
                            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 mb-4"><p className="text-sm text-slate-700 italic">"{b.aiSummary || "Bệnh nhân không cung cấp triệu chứng."}"</p></div>
                            <div className="flex gap-3">
                                {b.status === 'Chờ khám' && (<><button onClick={async () => { await updateBookingStatus(b.id, 'Đã xác nhận'); addToast("Đã xác nhận!", "success"); refreshAdminData(); }} className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold">Xác nhận</button><button onClick={async () => { await updateBookingStatus(b.id, 'Đã hủy'); addToast("Đã hủy!", "info"); refreshAdminData(); }} className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold">Hủy</button></>)}
                                {b.status === 'Đã xác nhận' && (<><button onClick={async () => { await updateBookingStatus(b.id, 'Đã hoàn thành'); addToast("Đã hoàn thành!", "success"); refreshAdminData(); }} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold">Hoàn thành</button><button onClick={async () => { await updateBookingStatus(b.id, 'Đã hủy'); addToast("Đã hủy!", "info"); refreshAdminData(); }} className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold">Hủy</button></>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {currentPage === 'admin' && user?.role === 'admin' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-black">Admin Dashboard</h2><button onClick={() => { setEditingDoctor({ name: '', specialty: Specialty.GENERAL, price: 200000, experience: 5, image: '', availableSlots: [] }); setShowDocModal(true); }} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Plus size={20}/> Thêm Bác sĩ</button></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<CalendarCheck size={24} className="text-blue-600"/>} label="Tổng lịch đặt" value={stats.totalBookings} colorClass="bg-blue-100" />
              <StatCard icon={<CheckCircle size={24} className="text-green-600"/>} label="Đã hoàn thành" value={stats.completedBookings} colorClass="bg-green-100" />
              <StatCard icon={<Stethoscope size={24} className="text-teal-600"/>} label="Số lượng Bác sĩ" value={stats.totalDoctors} colorClass="bg-teal-100" />
              <StatCard icon={<UsersIcon size={24} className="text-purple-600"/>} label="Người dùng" value={stats.totalUsers} colorClass="bg-purple-100" />
            </div>
            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setAdminTab('bookings')} className={`pb-2 px-4 font-bold ${adminTab === 'bookings' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400'}`}>Lịch hẹn</button>
                <button onClick={() => setAdminTab('doctors')} className={`pb-2 px-4 font-bold ${adminTab === 'doctors' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400'}`}>Bác sĩ</button>
                <button onClick={() => setAdminTab('users')} className={`pb-2 px-4 font-bold ${adminTab === 'users' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400'}`}>Người dùng</button>
            </div>
            {adminTab === 'users' && (
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b"><tr><th className="p-4">Họ tên</th><th className="p-4">SĐT</th><th className="p-4">Vai trò</th><th className="p-4 text-right">Thao tác</th></tr></thead>
                  <tbody>{allUsers.map(u => (<tr key={u.phone} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-bold">{u.fullName}</td><td className="p-4">{u.phone}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${u.role==='admin'?'bg-purple-100 text-purple-600':u.role==='doctor'?'bg-blue-100 text-blue-600':'bg-teal-100 text-teal-600'}`}>{u.role}</span></td>
                    <td className="p-4 text-right">{u.role === 'customer' && <button onClick={() => promoteToDoctor(u.phone)} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg">Cấp quyền BS</button>}</td>
                  </tr>))}</tbody>
                </table>
              </div>
            )}
            {adminTab === 'doctors' && (
                <div className="grid md:grid-cols-3 gap-6">{doctors.map(d => (
                    <div key={d.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 relative">
                        <div className="flex items-center gap-4 mb-4"><img src={d.image} className="w-16 h-16 rounded-2xl object-cover" /><div className="min-w-0"><h4 className="font-bold truncate">{d.name}</h4><p className="text-xs text-teal-600 uppercase font-bold">{d.specialty}</p></div></div>
                        <div className="flex justify-between items-center"><span className="text-xs text-slate-500">{(d.availableSlots||[]).length} khung giờ</span><div className="flex gap-2"><button onClick={() => { setEditingDoctor(d); setShowDocModal(true); }} className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Edit size={16}/></button><button onClick={() => setConfirmDeleteId(d.id)} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 size={16}/></button></div></div>
                    </div>
                ))}</div>
            )}
          </div>
        )}

        {currentPage === 'auth' && (
            <div className="flex flex-col items-center py-10 animate-slide-up">
                <form onSubmit={handleAuth} className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100">
                    <h2 className="text-3xl font-black mb-8 text-center">{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
                    <div className="space-y-4">
                        {authMode === 'register' && <input name="fullName" required placeholder="Họ và tên" className="w-full bg-slate-50 rounded-2xl p-4 border outline-none" />}
                        <input name="phone" required placeholder="Số điện thoại" className="w-full bg-slate-50 rounded-2xl p-4 border outline-none" />
                        <input name="password" type="password" required placeholder="Mật khẩu" className="w-full bg-slate-50 rounded-2xl p-4 border outline-none" />
                        <button disabled={isSubmitting} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Xác nhận'}</button>
                        <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-slate-400 text-sm">{authMode === 'login' ? 'Bạn mới? Tạo tài khoản' : 'Đã có tài khoản? Đăng nhập'}</button>
                    </div>
                </form>
            </div>
        )}
      </main>

      {/* MODAL: ADMIN EDIT DOCTOR */}
      {showDocModal && editingDoctor && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-5xl p-10 animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black">Thiết lập Bác sĩ</h3><button onClick={() => setShowDocModal(false)} className="p-2 bg-slate-100 rounded-full"><X/></button></div>
              <div className="grid lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-6">
                        <div className="w-24 h-24 bg-slate-200 rounded-[2rem] overflow-hidden flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                            {isUploading ? <Loader2 className="animate-spin text-teal-600"/> : editingDoctor.image ? <img src={editingDoctor.image} className="w-full h-full object-cover"/> : <Camera className="text-slate-400"/>}
                        </div>
                        <div className="flex-1">
                            <label className="bg-teal-50 text-teal-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer inline-block mb-3"><input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if(file) { setIsUploading(true); try { const url = await uploadDoctorImage(file); setEditingDoctor({...editingDoctor, image: url}); addToast("Tải ảnh xong!"); } finally { setIsUploading(false); } } }} />Tải ảnh</label>
                            
                            {/* NEW: URL INPUT */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">Hoặc nhập URL ảnh</label>
                                <div className="relative">
                                    <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input 
                                        type="text" 
                                        placeholder="https://..." 
                                        value={editingDoctor.image || ''} 
                                        onChange={(e) => setEditingDoctor({...editingDoctor, image: e.target.value})}
                                        className="w-full pl-10 p-3 rounded-2xl border border-slate-200 text-sm outline-none focus:border-teal-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                      </div>
                      <form onSubmit={onSaveDoctor} className="space-y-4">
                          <div className="relative">
                            <select required value={editingDoctor.userPhone || ''} onChange={e => { const u = allUsers.find(u => u.phone === e.target.value); if(u) setEditingDoctor({...editingDoctor, name: `BS. ${u.fullName}`, userPhone: u.phone}); }} className="w-full border-slate-200 rounded-2xl p-4 border outline-none appearance-none">
                                <option value="">-- Chọn tài khoản Bác sĩ --</option>
                                {allUsers.filter(u => u.role === 'doctor').map(u => <option key={u.phone} value={u.phone}>{u.fullName} - {u.phone}</option>)}
                            </select><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <select className="w-full border-slate-200 rounded-2xl p-4 border" value={editingDoctor.specialty} onChange={e => setEditingDoctor({...editingDoctor, specialty: e.target.value as Specialty})}>{Object.values(Specialty).map(s => <option key={s} value={s}>{s}</option>)}</select>
                            <input type="number" placeholder="Phí khám" value={editingDoctor.price} className="w-full border-slate-200 rounded-2xl p-4 border" onChange={e => setEditingDoctor({...editingDoctor, price: Number(e.target.value)})} />
                          </div>
                          <button type="submit" disabled={isUploading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black disabled:opacity-50">Lưu dữ liệu</button>
                      </form>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                      <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-teal-100 text-teal-600 rounded-xl"><Clock size={24}/></div><h4 className="text-xl font-black">Lịch rảnh</h4></div>
                      <input type="date" min={todayStr} max={maxDateStr} className="w-full p-4 rounded-2xl border mb-4 outline-none" value={adminSelectedDate} onChange={e => setAdminSelectedDate(e.target.value)} />
                      {adminSelectedDate && (<div className="grid grid-cols-3 gap-3">{TIME_OPTIONS.map(time => {
                          const isSelected = (editingDoctor.availableSlots || []).some(s => s.date === adminSelectedDate && s.time === time);
                          return (<button key={time} type="button" onClick={() => toggleSlot(adminSelectedDate, time)} className={`py-3 rounded-xl font-bold text-sm border ${isSelected ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-white text-slate-500 border-slate-200'}`}>{time}</button>);
                      })}</div>)}
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: BOOKING CONFIRMATION */}
      {showBookingModal && pendingDoctor && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-8 animate-slide-up shadow-2xl relative">
              <button onClick={() => setShowBookingModal(false)} className="absolute right-6 top-6 bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
              {bookingSuccess ? (
                <div className="py-12 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40}/></div>
                    <h3 className="text-3xl font-black">Đã đặt lịch!</h3><p className="text-slate-500 mt-2">Hệ thống đang chuyển hướng...</p>
                </div>
              ) : (
                <div className="space-y-6">
                    <div className="mb-6"><h3 className="text-2xl font-black">Xác nhận lịch khám</h3><p className="text-teal-600 font-bold text-sm uppercase">{pendingDoctor.specialty}</p></div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                        <img src={pendingDoctor.image} className="w-14 h-14 rounded-xl object-cover border" />
                        <div><p className="font-bold text-slate-800">{pendingDoctor.name}</p><p className="text-xs text-slate-400">Kinh nghiệm: {pendingDoctor.experience} năm</p></div>
                    </div>
                    {bookingSummary && (<div className="bg-purple-50 p-4 rounded-2xl border border-purple-100"><p className="text-[10px] font-black text-purple-600 uppercase mb-1">Tóm tắt y tế</p><p className="text-xs text-slate-700 italic">"{bookingSummary}"</p></div>)}
                    <div className="space-y-4">
                        <div>
                            <label className="font-bold text-xs text-slate-400 uppercase ml-1">1. Chọn ngày khám</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2">
                                {availableDatesForDoctor.map(date => (
                                    <button key={date} onClick={() => setBookingDate(date)} className={`shrink-0 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${bookingDate === date ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-600'}`}>
                                        {date === todayStr ? 'Hôm nay' : date.split('-').reverse().slice(0,2).join('/')}
                                    </button>
                                ))}
                                {availableDatesForDoctor.length === 0 && <p className="text-xs text-red-500 p-2">Bác sĩ hiện không có lịch rảnh nào.</p>}
                            </div>
                        </div>
                        {bookingDate && (
                            <div className="animate-fade-in">
                                <label className="font-bold text-xs text-slate-400 uppercase ml-1">2. Chọn giờ trống</label>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {availableTimesForDate.map(time => {
                                        const isBooked = occupiedSlots.includes(time);
                                        const isSelected = bookingTime === time;
                                        return (
                                            <button key={time} disabled={isBooked} onClick={() => setBookingTime(time)} className={`py-3 rounded-xl font-bold text-xs border transition-all ${isBooked ? 'bg-slate-100 text-slate-300' : isSelected ? 'bg-teal-600 text-white shadow-md' : 'bg-white hover:border-teal-500'}`}>
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4"><span className="text-slate-500 text-sm">Phí khám:</span><span className="font-black text-xl text-slate-900">{pendingDoctor.price.toLocaleString()}đ</span></div>
                        <button 
                            disabled={!bookingDate || !bookingTime || isSubmitting} 
                            onClick={async () => { 
                                setIsSubmitting(true); 
                                const ok = await saveBooking({ doctorId: pendingDoctor.id, doctorName: pendingDoctor.name, doctorImage: pendingDoctor.image, specialty: pendingDoctor.specialty, date: bookingDate, time: bookingTime, userPhone: user?.phone, userFullName: user?.fullName, aiSummary: bookingSummary }); 
                                if (ok) { setBookingSuccess(true); refreshAdminData(); setTimeout(() => { setShowBookingModal(false); setBookingSuccess(false); setCurrentPage('history'); }, 2000); } 
                                setIsSubmitting(false); 
                            }} 
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-teal-600 transition-all disabled:opacity-30"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "Xác nhận lịch khám"}
                        </button>
                    </div>
                </div>
              )}
           </div>
        </div>
      )}

      {/* NEW: MODAL CONFIRM CANCEL */}
      {cancelModalData.show && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 animate-slide-up shadow-2xl relative border-2 border-slate-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border-4 border-red-100">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Hủy lịch hẹn?</h3>
                    <p className="text-slate-500 text-sm mb-6 px-4">
                        Hành động này không thể hoàn tác. Lịch hẹn của bạn sẽ bị hủy bỏ.
                    </p>
                    <div className="flex flex-col w-full gap-3">
                        <button 
                            onClick={handleConfirmCancel} 
                            disabled={isCancelling}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                        >
                            {isCancelling ? <Loader2 className="animate-spin" size={20}/> : <Trash2 size={20} />}
                            {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                        </button>
                        <button 
                            onClick={() => setCancelModalData({show: false, bookingId: null})} 
                            disabled={isCancelling}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all"
                        >
                            Đóng, không hủy
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* NEW: MODAL CONFIRM DELETE DOCTOR */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 animate-slide-up shadow-2xl relative border-2 border-slate-100">
                 <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 border-4 border-red-100">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Xóa bác sĩ này?</h3>
                    <p className="text-slate-500 text-sm mb-6 px-4">
                        Hành động này sẽ xóa bác sĩ khỏi hệ thống vĩnh viễn và không thể hoàn tác.
                    </p>
                    <div className="flex flex-col w-full gap-3">
                        <button 
                            onClick={() => executeDelete(confirmDeleteId)} 
                            disabled={!!isDeletingId}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                        >
                            {isDeletingId ? <Loader2 className="animate-spin" size={20}/> : <Trash2 size={20} />}
                            {isDeletingId ? 'Đang xóa...' : 'Xác nhận xóa'}
                        </button>
                        <button 
                            onClick={() => setConfirmDeleteId(null)} 
                            disabled={!!isDeletingId}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all"
                        >
                            Hủy bỏ
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;
