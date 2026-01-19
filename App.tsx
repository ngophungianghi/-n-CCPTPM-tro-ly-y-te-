
import React, { useState, useEffect, useMemo } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { DoctorList } from './components/DoctorList';
import { 
  Home as HomeIcon, MessageSquare, Stethoscope, History, User as UserIcon,
  LogOut, ChevronRight, ChevronDown, Calendar, Phone, X, CheckCircle,
  ArrowRight, Loader2, Trash2, Clock, Settings, Plus, Edit, Briefcase,
  Search, Filter, Lock, Info, Camera, HelpCircle, Check, Users as UsersIcon, Link as LinkIcon,
  AlertCircle, LayoutDashboard, TrendingUp, CalendarCheck, XCircle,
  Shield, Zap, Activity, Star, Award, HeartPulse, Bot, FileText, UserPlus
} from 'lucide-react';
import { Doctor, User, Booking, Specialty, AvailableSlot } from './types';
import { 
  fetchDoctors, saveBooking, fetchUserBookings, updateBookingStatus, 
  fetchAllBookings, saveDoctor, deleteDoctor, registerUser, loginUser,
  checkAvailability, fetchAllUsers, uploadDoctorImage, updateUserRole
} from './services/databaseService';

type Page = 'home' | 'chat' | 'doctors' | 'history' | 'auth' | 'admin' | 'doctor_dashboard';
type AuthMode = 'login' | 'register';
type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

const TIME_OPTIONS = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];

// --- COMPONENT: NAV BUTTON ---
const NavBtn = ({active, icon, label, onClick}: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }} 
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
  >
    {icon} <span className="hidden lg:inline">{label}</span>
  </button>
);

// --- COMPONENT: TOAST NOTIFICATION ---
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

// --- COMPONENT: BOOKING CARD ---
interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: string) => void | Promise<void>;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel }) => {
  const isPending = booking.status === 'Chờ khám';
  
  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all animate-slide-up">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4 items-center">
          <img 
            src={booking.doctorImage || 'https://via.placeholder.com/100'} 
            className="w-12 h-12 rounded-2xl object-cover border" 
            alt={booking.doctorName} 
          />
          <div>
            <h4 className="font-bold text-slate-800">{booking.doctorName}</h4>
            <p className="text-xs text-teal-600 font-bold uppercase">{booking.specialty}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
          booking.status === 'Chờ khám' ? 'bg-amber-100 text-amber-600' :
          booking.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' : 
          booking.status === 'Đã xác nhận' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
        }`}>
          {booking.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
        <div className="flex items-center gap-2 text-slate-500">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-xs font-bold">{booking.date.split('-').reverse().join('/')}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Clock size={14} className="text-slate-400" />
          <span className="text-xs font-bold">{booking.time}</span>
        </div>
      </div>
      
      {isPending && onCancel && (
        <button 
          onClick={() => onCancel(booking.id)}
          className="w-full mt-4 text-xs font-bold text-red-400 hover:text-red-600 py-2 transition-colors flex items-center justify-center gap-1"
        >
          <X size={14} /> Hủy lịch hẹn
        </button>
      )}
    </div>
  );
};

// --- COMPONENT: STATS CARD (ADMIN) ---
const StatCard = ({ icon, label, value, colorClass }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

// --- COMPONENT: FEATURE CARD (HOME) ---
const FeatureCard = ({ icon, title, description, colorClass, onClick }: any) => (
  <div onClick={onClick} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${colorClass}`}>
      {icon}
    </div>
    <h3 className="text-xl font-black text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    <div className="mt-6 flex items-center text-sm font-bold text-slate-900 gap-2 group-hover:gap-3 transition-all">
      Khám phá <ArrowRight size={16} />
    </div>
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
  
  // Trạng thái cho việc xóa
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [adminSelectedDate, setAdminSelectedDate] = useState<string>('');

  const [pendingDoctor, setPendingDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  // New state for AI summary
  const [bookingSummary, setBookingSummary] = useState<string>('');
  
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // TOAST STATE
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

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
      const savedUser = localStorage.getItem('care_ai_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser(u);
        const userBks = await fetchUserBookings(u.phone);
        setBookings(userBks);
        
        // Điều hướng nếu là doctor
        if (u.role === 'doctor') {
            setCurrentPage('doctor_dashboard');
            refreshAdminData(); // Bác sĩ cần load allBookings để xem danh sách bệnh nhân
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
                addToast("Đăng ký tài khoản thành công!", "success");
            } else addToast("Số điện thoại đã tồn tại!", "error");
        } else {
            const u = await loginUser(phone, password);
            if (u) {
                setUser(u);
                localStorage.setItem('care_ai_user', JSON.stringify(u));
                const userBks = await fetchUserBookings(phone);
                setBookings(userBks);
                // Logic điều hướng sau đăng nhập
                if (u.role === 'admin') setCurrentPage('admin');
                else if (u.role === 'doctor') {
                    setCurrentPage('doctor_dashboard');
                    refreshAdminData();
                }
                else setCurrentPage('home');
                
                addToast(`Chào mừng trở lại, ${u.role === 'doctor' ? 'BS. ' : ''}${u.fullName}!`, "success");
            } else addToast("Số điện thoại hoặc mật khẩu không chính xác!", "error");
        }
    } catch (err) {
        addToast("Có lỗi xảy ra, vui lòng thử lại!", "error");
    } finally {
        setIsSubmitting(false);
    }
  };

  const promoteToDoctor = async (userPhone: string) => {
    const ok = await updateUserRole(userPhone, 'doctor');
    if (ok) {
        addToast("Đã cấp quyền Bác sĩ thành công!", "success");
        refreshAdminData();
    } else {
        addToast("Lỗi khi cấp quyền!", "error");
    }
  };

  const toggleSlot = (date: string, time: string) => {
    if (!editingDoctor) return;
    const currentSlots = editingDoctor.availableSlots || [];
    const exists = currentSlots.find(s => s.date === date && s.time === time);
    const newSlots = exists 
        ? currentSlots.filter(s => !(s.date === date && s.time === time))
        : [...currentSlots, { date, time }];
    setEditingDoctor({ ...editingDoctor, availableSlots: newSlots });
  };

  const onSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor?.name || !editingDoctor?.specialty) return addToast("Vui lòng điền đủ thông tin!", "error");
    await saveDoctor(editingDoctor as Doctor);
    await refreshAdminData();
    setShowDocModal(false);
    setEditingDoctor(null);
    addToast("Lưu thông tin bác sĩ thành công!", "success");
  };

  const executeDelete = async (id: string) => {
    console.log("Thực hiện xóa bác sĩ ID:", id);
    setIsDeletingId(id);
    try {
      await deleteDoctor(id);
      setDoctors(prev => prev.filter(d => d.id !== id));
      setAllBookings(prev => prev.filter(b => b.doctorId !== id));
      setConfirmDeleteId(null);
      addToast("Đã xóa bác sĩ thành công.", "success");
    } catch (error: any) {
      console.error("Lỗi xóa:", error);
      addToast("Không thể xóa bác sĩ. Lỗi kết nối!", "error");
    } finally {
      setIsDeletingId(null);
    }
  };

  // --- STATS CALCULATION FOR ADMIN ---
  const stats = useMemo(() => {
    const totalBookings = allBookings.length;
    const completedBookings = allBookings.filter(b => b.status === 'Đã hoàn thành').length;
    const totalUsers = allUsers.length;
    const totalDoctors = doctors.length;
    return { totalBookings, completedBookings, totalUsers, totalDoctors };
  }, [allBookings, allUsers, doctors]);

  // --- FILTER BOOKINGS FOR LOGGED IN DOCTOR ---
  const doctorBookings = useMemo(() => {
    if (user?.role !== 'doctor') return [];
    
    // Tìm hồ sơ bác sĩ ứng với tài khoản user đang đăng nhập (thông qua phone hoặc name)
    const currentDoctorProfile = doctors.find(d => 
        (d.userPhone && d.userPhone === user.phone) || 
        d.name.includes(user.fullName)
    );

    if (!currentDoctorProfile) return [];

    // Lọc booking dựa trên ID của bác sĩ tìm được
    return allBookings.filter(b => b.doctorId === currentDoctorProfile.id);
  }, [allBookings, user, doctors]);

  // --- GET DOCTOR USERS FOR DROPDOWN ---
  const doctorUsers = useMemo(() => {
      return allUsers.filter(u => u.role === 'doctor');
  }, [allUsers]);

  const availableDatesForDoctor = useMemo(() => {
    if (!pendingDoctor) return [];
    const dates = (pendingDoctor.availableSlots || [])
        .filter(s => s.date >= todayStr)
        .map(s => s.date);
    return Array.from(new Set(dates)).sort();
  }, [pendingDoctor, todayStr]);

  const availableTimesForDate = useMemo(() => {
    if (!pendingDoctor || !bookingDate) return [];
    return (pendingDoctor.availableSlots || [])
        .filter(s => s.date === bookingDate)
        .map(s => s.time)
        .sort();
  }, [pendingDoctor, bookingDate]);

  const isPast = (date: string) => date < todayStr;
  
  const filteredUserBookings = bookings; 
  const filteredAdminBookings = allBookings.filter(b => !isPast(b.date) || b.status !== 'Chờ khám');

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
                // DOCTOR NAV
                <NavBtn active={currentPage === 'doctor_dashboard'} onClick={() => setCurrentPage('doctor_dashboard')} icon={<Activity size={18}/>} label="Ca trực của tôi"/>
             ) : (
                // CUSTOMER & ADMIN NAV
                <>
                    <NavBtn active={currentPage === 'home'} onClick={() => setCurrentPage('home')} icon={<HomeIcon size={18}/>} label="Trang chủ"/>
                    <NavBtn active={currentPage === 'chat'} onClick={() => setCurrentPage('chat')} icon={<MessageSquare size={18}/>} label="Tư vấn AI"/>
                    <NavBtn active={currentPage === 'doctors'} onClick={() => setCurrentPage('doctors')} icon={<Briefcase size={18}/>} label="Bác sĩ"/>
                    <NavBtn active={currentPage === 'history'} onClick={() => setCurrentPage('history')} icon={<History size={18}/>} label="Lịch sử"/>
                    {user?.role === 'admin' && <NavBtn active={currentPage === 'admin'} onClick={() => setCurrentPage('admin')} icon={<Settings size={18}/>} label="Admin"/>}
                </>
             )}
          </div>
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              if (user) {
                setUser(null); 
                localStorage.removeItem('care_ai_user'); 
                setCurrentPage('home'); 
                addToast("Đã đăng xuất thành công.", "info");
              } else {
                setCurrentPage('auth');
              }
            }} 
            className="text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl transition-all"
          >
            {user ? (
              <>
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white">
                  {user.fullName[0]}
                </div> 
                <span className="hidden sm:inline">{user.role === 'doctor' ? 'BS. ' : ''}{user.fullName}</span>
                <LogOut size={18}/>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <UserIcon size={18} />
                <span>Đăng nhập</span>
              </div>
            )}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 mt-4">
        {currentPage === 'home' && (
            <div className="animate-fade-in space-y-10">
                {/* HERO SECTION */}
                <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-500/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                          <span className="text-teal-400 text-xs font-bold uppercase tracking-wider">Hệ thống Y tế thông minh 4.0</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                            Chăm sóc sức khỏe <br/>
                            <span className="text-teal-400">chủ động & toàn diện</span>
                        </h1>
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-lg">
                            Kết nối với bác sĩ chuyên khoa hàng đầu, chẩn đoán sơ bộ bằng AI và đặt lịch khám nhanh chóng. Trải nghiệm y tế không chờ đợi.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => setCurrentPage('chat')} className="bg-teal-500 text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg shadow-teal-500/20">
                                <Zap size={20}/> Tư vấn AI ngay
                            </button>
                            <button onClick={() => setCurrentPage('doctors')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/20 transition-all">
                                <Search size={20}/> Tìm bác sĩ
                            </button>
                        </div>
                    </div>
                    
                    {/* Abstract Shapes Decoration */}
                    <div className="absolute right-[-10%] top-[-20%] w-[60%] h-[140%] bg-teal-500/10 blur-[100px] rounded-full"></div>
                    <div className="absolute left-[30%] bottom-[-20%] w-[40%] h-[80%] bg-purple-500/10 blur-[100px] rounded-full"></div>
                </div>

                {/* STATS BAR */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                    <p className="text-3xl font-black text-slate-800 mb-1">50+</p>
                    <p className="text-xs font-bold text-slate-400 uppercase">Bác sĩ chuyên khoa</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                    <p className="text-3xl font-black text-slate-800 mb-1">24/7</p>
                    <p className="text-xs font-bold text-slate-400 uppercase">Hỗ trợ trực tuyến</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                    <p className="text-3xl font-black text-slate-800 mb-1">10k+</p>
                    <p className="text-xs font-bold text-slate-400 uppercase">Lượt khám thành công</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-1 mb-1 text-yellow-400">
                      <Star fill="currentColor" size={24}/> <span className="text-3xl font-black text-slate-800">4.9</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Đánh giá hài lòng</p>
                  </div>
                </div>

                {/* FEATURE CARDS */}
                <div>
                  <div className="flex items-end justify-between mb-8 px-4">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 mb-2">Dịch vụ nổi bật</h2>
                      <p className="text-slate-500">Giải pháp toàn diện cho sức khỏe của bạn</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                      <FeatureCard 
                        icon={<Bot size={28}/>} 
                        title="Chẩn đoán AI" 
                        description="Sử dụng trí tuệ nhân tạo để phân tích triệu chứng ban đầu, gợi ý chuyên khoa phù hợp và đưa ra lời khuyên y tế tức thì."
                        colorClass="bg-teal-100 text-teal-600"
                        onClick={() => setCurrentPage('chat')}
                      />
                      <FeatureCard 
                        icon={<CalendarCheck size={28}/>} 
                        title="Đặt lịch 1 chạm" 
                        description="Tra cứu lịch rảnh của bác sĩ theo thời gian thực. Đặt lịch khám nhanh chóng, không cần chờ đợi, tiết kiệm thời gian."
                        colorClass="bg-blue-100 text-blue-600"
                        onClick={() => setCurrentPage('doctors')}
                      />
                      <FeatureCard 
                        icon={<Activity size={28}/>} 
                        title="Hồ sơ sức khỏe" 
                        description="Lưu trữ lịch sử khám bệnh, dễ dàng theo dõi tình trạng sức khỏe cá nhân và người thân mọi lúc mọi nơi."
                        colorClass="bg-purple-100 text-purple-600"
                        onClick={() => setCurrentPage('history')}
                      />
                  </div>
                </div>

                {/* HOW IT WORKS */}
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100">
                   <div className="text-center max-w-2xl mx-auto mb-12">
                      <h2 className="text-3xl font-black text-slate-800 mb-4">Quy trình đơn giản</h2>
                      <p className="text-slate-500">Chỉ với 3 bước đơn giản để bắt đầu chăm sóc sức khỏe của bạn ngay hôm nay.</p>
                   </div>
                   <div className="grid md:grid-cols-3 gap-8 relative">
                      <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10"></div>
                      <div className="text-center">
                        <div className="w-24 h-24 bg-white border-4 border-slate-50 shadow-xl rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-slate-300">1</div>
                        <h4 className="font-bold text-lg mb-2">Mô tả triệu chứng</h4>
                        <p className="text-sm text-slate-500 px-4">Chat với AI để được sơ chẩn và định hướng chuyên khoa.</p>
                      </div>
                      <div className="text-center">
                        <div className="w-24 h-24 bg-teal-500 border-4 border-teal-100 shadow-xl shadow-teal-200 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-white">2</div>
                        <h4 className="font-bold text-lg mb-2">Chọn bác sĩ</h4>
                        <p className="text-sm text-slate-500 px-4">Xem thông tin chi tiết và chọn bác sĩ phù hợp với nhu cầu.</p>
                      </div>
                      <div className="text-center">
                        <div className="w-24 h-24 bg-white border-4 border-slate-50 shadow-xl rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black text-slate-300">3</div>
                        <h4 className="font-bold text-lg mb-2">Đến khám</h4>
                        <p className="text-sm text-slate-500 px-4">Đến phòng khám theo lịch đã hẹn. Không cần xếp hàng.</p>
                      </div>
                   </div>
                </div>
                
                {/* FOOTER MINI */}
                <div className="border-t border-slate-200 pt-8 pb-4 text-center">
                  <p className="text-slate-400 text-sm font-medium">© 2024 CareAI - Nền tảng Y tế thông minh.</p>
                </div>
            </div>
        )}

        {currentPage === 'chat' && <div className="h-[75vh]"><ChatInterface doctors={doctors} onBook={(d, summary) => { setPendingDoctor(d); setBookingSummary(summary || ''); if(!user) setCurrentPage('auth'); else setShowBookingModal(true); }} /></div>}
        {currentPage === 'doctors' && <div className="h-[75vh]"><DoctorList doctors={doctors} onBook={(d, summary) => { setPendingDoctor(d); setBookingSummary(summary || ''); if(!user) setCurrentPage('auth'); else setShowBookingModal(true); }} /></div>}

        {currentPage === 'history' && (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-3xl font-black">Lịch hẹn của bạn</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUserBookings.map(b => (
                      <BookingCard 
                        key={b.id} 
                        booking={b} 
                        onCancel={async (id) => {
                          const success = await updateBookingStatus(id, 'Đã hủy');
                          if (success) {
                            addToast("Đã hủy lịch hẹn.", "info");
                            if (user) {
                              const updated = await fetchUserBookings(user.phone);
                              setBookings(updated);
                            }
                          }
                        }} 
                      />
                    ))}
                    {filteredUserBookings.length === 0 && <p className="text-slate-400 col-span-full py-10 text-center">Chưa có lịch hẹn nào.</p>}
                </div>
            </div>
        )}

        {/* DOCTOR DASHBOARD */}
        {currentPage === 'doctor_dashboard' && user?.role === 'doctor' && (
            <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center bg-teal-600 text-white p-8 rounded-[3rem] shadow-xl">
                    <div>
                        <h2 className="text-3xl font-black">Xin chào, {user.fullName}</h2>
                        <p className="opacity-90 mt-2">Chúc bác sĩ một ngày làm việc hiệu quả!</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                        <CalendarCheck size={32} />
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="text-teal-600"/> Danh sách bệnh nhân ({doctorBookings.length})</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {doctorBookings.map(b => (
                            <div key={b.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-500">{b.userFullName[0]}</div>
                                        <div>
                                            <h4 className="font-bold text-lg">{b.userFullName}</h4>
                                            <p className="text-slate-400 text-sm flex items-center gap-1"><Phone size={12}/> {b.userPhone}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${b.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' : b.status === 'Đã xác nhận' ? 'bg-blue-100 text-blue-600' : b.status === 'Đã hủy' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {b.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-4">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar size={16} className="text-teal-600" />
                                        <span className="font-bold text-sm">{b.date.split('-').reverse().join('/')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock size={16} className="text-teal-600" />
                                        <span className="font-bold text-sm">{b.time}</span>
                                    </div>
                                </div>

                                {/* AI SUMMARY CARD */}
                                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bot size={16} className="text-purple-600"/>
                                        <span className="text-xs font-black text-purple-600 uppercase">Phiếu tóm tắt AI</span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed italic">
                                        "{b.aiSummary || "Bệnh nhân không cung cấp triệu chứng chi tiết."}"
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    {b.status === 'Chờ khám' && (
                                      <>
                                        <button 
                                            onClick={async () => {
                                                await updateBookingStatus(b.id, 'Đã xác nhận');
                                                addToast("Đã xác nhận lịch hẹn!", "success");
                                                refreshAdminData();
                                            }}
                                            className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                                        >
                                            Xác nhận
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                await updateBookingStatus(b.id, 'Đã hủy');
                                                addToast("Đã hủy lịch hẹn!", "info");
                                                refreshAdminData();
                                            }}
                                            className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                      </>
                                    )}
                                    {(b.status === 'Đã xác nhận') && (
                                      <>
                                        <button 
                                            onClick={async () => {
                                                await updateBookingStatus(b.id, 'Đã hoàn thành');
                                                addToast("Đã hoàn thành ca khám!", "success");
                                                refreshAdminData();
                                            }}
                                            className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors shadow-lg shadow-teal-100"
                                        >
                                            Hoàn thành
                                        </button>
                                         <button 
                                            onClick={async () => {
                                                await updateBookingStatus(b.id, 'Đã hủy');
                                                addToast("Đã hủy lịch hẹn!", "info");
                                                refreshAdminData();
                                            }}
                                            className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                        >
                                            Hủy
                                        </button>
                                      </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {doctorBookings.length === 0 && <p className="text-slate-400 col-span-full text-center py-10">Chưa có lịch hẹn nào.</p>}
                    </div>
                </div>
            </div>
        )}

        {currentPage === 'admin' && user?.role === 'admin' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black">Admin Dashboard</h2>
              <button onClick={() => { setEditingDoctor({ name: '', specialty: Specialty.GENERAL, price: 200000, experience: 5, image: '', availableSlots: [] }); setShowDocModal(true); }} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-all"><Plus size={20}/> Thêm Bác sĩ</button>
            </div>
            
            {/* ADMIN STATS DASHBOARD */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<CalendarCheck size={24} className="text-blue-600"/>} label="Tổng lịch đặt" value={stats.totalBookings} colorClass="bg-blue-100" />
              <StatCard icon={<CheckCircle size={24} className="text-green-600"/>} label="Đã hoàn thành" value={stats.completedBookings} colorClass="bg-green-100" />
              <StatCard icon={<Stethoscope size={24} className="text-teal-600"/>} label="Số lượng Bác sĩ" value={stats.totalDoctors} colorClass="bg-teal-100" />
              <StatCard icon={<UsersIcon size={24} className="text-purple-600"/>} label="Người dùng" value={stats.totalUsers} colorClass="bg-purple-100" />
            </div>

            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setAdminTab('bookings')} className={`pb-2 px-4 font-bold transition-all ${adminTab === 'bookings' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>Lịch hẹn khách đặt</button>
                <button onClick={() => setAdminTab('doctors')} className={`pb-2 px-4 font-bold transition-all ${adminTab === 'doctors' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>Quản lý Bác sĩ & Lịch rảnh</button>
                <button onClick={() => setAdminTab('users')} className={`pb-2 px-4 font-bold transition-all ${adminTab === 'users' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>Người dùng</button>
            </div>

            {adminTab === 'doctors' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map(d => (
                        <div key={d.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            {confirmDeleteId === d.id && (
                              <div className="absolute inset-0 z-10 bg-red-600/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                                  <AlertCircle className="text-white mb-2" size={32} />
                                  <p className="text-white font-bold text-sm mb-4">Bạn chắc chắn muốn xóa bác sĩ này?</p>
                                  <div className="flex gap-3 w-full">
                                      <button 
                                        disabled={isDeletingId === d.id}
                                        onClick={() => executeDelete(d.id)}
                                        className="flex-1 bg-white text-red-600 py-3 rounded-xl font-black text-xs hover:bg-slate-100 flex items-center justify-center gap-2"
                                      >
                                          {isDeletingId === d.id ? <Loader2 size={14} className="animate-spin"/> : "XÓA NGAY"}
                                      </button>
                                      <button 
                                        disabled={isDeletingId === d.id}
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="flex-1 bg-transparent border border-white/50 text-white py-3 rounded-xl font-black text-xs hover:bg-white/10"
                                      >
                                          HỦY
                                      </button>
                                  </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                                <img src={d.image || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-2xl object-cover border"/>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-lg truncate">{d.name}</h4>
                                    <p className="text-xs text-teal-600 font-bold uppercase">{d.specialty}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock size={12}/> {(d.availableSlots || []).filter(s => !isPast(s.date)).length} khung giờ rảnh
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                      type="button"
                                      onClick={() => { setEditingDoctor(d); setShowDocModal(true); }} 
                                      className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100 transition-all"
                                    >
                                      <Edit size={16}/>
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setConfirmDeleteId(d.id)} 
                                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                      title="Xóa bác sĩ"
                                    >
                                      <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {doctors.length === 0 && <p className="text-slate-400 col-span-full py-10 text-center">Chưa có bác sĩ nào trong hệ thống.</p>}
                </div>
            )}
            
            {adminTab === 'bookings' && (
                <div className="grid gap-4">
                    {filteredAdminBookings.map(b => (
                        <div key={b.id} className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <div className="flex gap-4 items-center">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">{b.userFullName[0]}</div>
                                <div>
                                    <h4 className="font-bold">{b.userFullName} <span className="text-xs text-slate-400 font-normal">({b.userPhone})</span></h4>
                                    <p className="text-sm text-slate-500">Đặt: {b.doctorName} • {b.time}, {b.date}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {b.status === 'Chờ khám' && (
                                    <>
                                        <button onClick={() => { updateBookingStatus(b.id, 'Đã hoàn thành').then(refreshAdminData); addToast("Đã xác nhận hoàn thành!", "success"); }} className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-xs hover:bg-green-100 transition-colors">Xong</button>
                                        <button onClick={() => { updateBookingStatus(b.id, 'Đã hủy').then(refreshAdminData); addToast("Đã hủy lịch đặt.", "info"); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors">Hủy</button>
                                    </>
                                )}
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${b.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{b.status}</span>
                            </div>
                        </div>
                    ))}
                    {filteredAdminBookings.length === 0 && <p className="text-slate-400 text-center py-10">Không có lịch đặt nào.</p>}
                </div>
            )}

            {adminTab === 'users' && (
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-xs font-black uppercase text-slate-400">Họ tên</th>
                      <th className="p-4 text-xs font-black uppercase text-slate-400">Số điện thoại</th>
                      <th className="p-4 text-xs font-black uppercase text-slate-400">Vai trò</th>
                      <th className="p-4 text-xs font-black uppercase text-slate-400 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.phone} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                        <td className="p-4 font-bold text-slate-800">{u.fullName}</td>
                        <td className="p-4 text-slate-500">{u.phone}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                            u.role === 'doctor' ? 'bg-blue-100 text-blue-600' : 'bg-teal-100 text-teal-600'
                          }`}>
                            {u.role === 'admin' ? 'Quản trị viên' : u.role === 'doctor' ? 'Bác sĩ' : 'Khách hàng'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                            {u.role === 'customer' && (
                                <button 
                                    onClick={() => promoteToDoctor(u.phone)}
                                    className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-600 transition-colors flex items-center gap-1 ml-auto"
                                >
                                    <UserPlus size={14}/> Cấp quyền BS
                                </button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {currentPage === 'auth' && (
            <div className="flex flex-col items-center py-10 animate-slide-up">
                <form onSubmit={handleAuth} className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100">
                    <h2 className="text-3xl font-black mb-8 text-center">{authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h2>
                    <div className="space-y-4">
                        {authMode === 'register' && <input name="fullName" required placeholder="Họ và tên" className="w-full bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 transition-all" />}
                        <input name="phone" required placeholder="Số điện thoại" className="w-full bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
                        <input name="password" type="password" required placeholder="Mật khẩu" className="w-full bg-slate-50 rounded-2xl p-4 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-teal-500 transition-all" />
                        <button disabled={isSubmitting} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Xác nhận'}
                        </button>
                        <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-slate-400 text-sm hover:text-slate-600">
                            {authMode === 'login' ? 'Bạn mới? Tạo tài khoản ngay' : 'Đã có tài khoản? Đăng nhập'}
                        </button>
                    </div>
                </form>
            </div>
        )}
      </main>

      {/* MODAL: ADMIN EDIT DOCTOR */}
      {showDocModal && editingDoctor && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-5xl p-10 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black">Thiết lập Bác sĩ & Lịch rảnh</h3>
                <button onClick={() => setShowDocModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X/></button>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                          <div className="flex items-center gap-6">
                              <div className="relative w-24 h-24 bg-slate-200 rounded-[2rem] overflow-hidden flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                                  {isUploading ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <Loader2 className="animate-spin text-teal-600"/>
                                      <span className="text-[10px] font-bold text-teal-600">Đang tải...</span>
                                    </div>
                                  ) : editingDoctor.image ? (
                                    <img src={editingDoctor.image} className="w-full h-full object-cover"/>
                                  ) : (
                                    <Camera className="text-slate-400"/>
                                  )}
                              </div>
                              <div className="space-y-3 flex-1">
                                <p className="text-sm font-bold text-slate-700">Ảnh chân dung bác sĩ</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <label className="bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-teal-100 transition-colors">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    if (file.size > 5 * 1024 * 1024) {
                                                        addToast("File ảnh quá lớn (tối đa 5MB).", "error");
                                                        return;
                                                    }
                                                    setIsUploading(true);
                                                    try {
                                                        const url = await uploadDoctorImage(file);
                                                        setEditingDoctor(prev => prev ? {...prev, image: url} : prev);
                                                        addToast("Tải ảnh lên thành công!", "success");
                                                    } catch (err: any) {
                                                        addToast("Lỗi tải ảnh: " + err.message, "error");
                                                    } finally {
                                                        setIsUploading(false);
                                                        e.target.value = '';
                                                    }
                                                }} 
                                            />
                                            Tải ảnh lên
                                        </label>
                                        <span className="text-[10px] text-slate-400 italic">Hoặc dán URL bên dưới</span>
                                    </div>
                                    <div className="relative">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                                            value={editingDoctor.image || ''}
                                            onChange={(e) => setEditingDoctor(prev => prev ? {...prev, image: e.target.value} : prev)}
                                        />
                                    </div>
                                </div>
                              </div>
                          </div>
                      </div>

                      <form onSubmit={onSaveDoctor} className="space-y-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Chọn Bác sĩ từ danh sách tài khoản</label>
                              <div className="relative">
                                <select 
                                    required 
                                    value={editingDoctor.userPhone || ''} 
                                    onChange={e => {
                                        const selectedPhone = e.target.value;
                                        const selectedUser = doctorUsers.find(u => u.phone === selectedPhone);
                                        if (selectedUser) {
                                            setEditingDoctor({
                                                ...editingDoctor,
                                                name: `BS. ${selectedUser.fullName}`,
                                                userPhone: selectedUser.phone
                                            });
                                        }
                                    }}
                                    className="w-full border-slate-200 rounded-2xl p-4 border bg-white outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                                >
                                    <option value="">-- Chọn tài khoản --</option>
                                    {doctorUsers.map(u => (
                                        <option key={u.phone} value={u.phone}>
                                            {u.fullName} - {u.phone}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                              </div>
                              {doctorUsers.length === 0 && (
                                <p className="text-[10px] text-red-400 mt-1">
                                    * Chưa có tài khoản nào được cấp quyền "Doctor". Vui lòng vào tab "Người dùng" để cấp quyền trước.
                                </p>
                              )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Chuyên khoa</label>
                                <select className="w-full border-slate-200 rounded-2xl p-4 border bg-white outline-none focus:ring-2 focus:ring-teal-500" value={editingDoctor.specialty} onChange={e => setEditingDoctor({...editingDoctor, specialty: e.target.value as Specialty})}>
                                    {Object.values(Specialty).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phí khám (VNĐ)</label>
                                <input type="number" value={editingDoctor.price} className="w-full border-slate-200 rounded-2xl p-4 border outline-none focus:ring-2 focus:ring-teal-500" onChange={e => setEditingDoctor({...editingDoctor, price: Number(e.target.value)})} />
                            </div>
                          </div>
                          <button type="submit" disabled={isUploading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-teal-600 transition-all disabled:bg-slate-300">Lưu thay đổi</button>
                      </form>
                  </div>

                  <div className="space-y-6 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-100 text-teal-600 rounded-xl"><Clock size={24}/></div>
                          <h4 className="text-xl font-black">Quản lý lịch rảnh</h4>
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">1. Chọn ngày (7 ngày tới)</label>
                          <input type="date" min={todayStr} max={maxDateStr} className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 bg-white" value={adminSelectedDate} onChange={e => setAdminSelectedDate(e.target.value)} />
                      </div>

                      {adminSelectedDate && (
                          <div className="space-y-4 animate-fade-in">
                              <label className="text-xs font-bold text-slate-500 uppercase">2. Chọn giờ rảnh trong ngày này:</label>
                              <div className="grid grid-cols-3 gap-3">
                                  {TIME_OPTIONS.map(time => {
                                      const isSelected = (editingDoctor.availableSlots || []).some(s => s.date === adminSelectedDate && s.time === time);
                                      return (
                                          <button 
                                            key={time} 
                                            type="button"
                                            onClick={() => toggleSlot(adminSelectedDate, time)}
                                            className={`py-3 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2
                                                ${isSelected ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-100' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-400'}`}
                                          >
                                              {isSelected && <Check size={14}/>}
                                              {time}
                                          </button>
                                      );
                                  })}
                              </div>
                          </div>
                      )}

                      <div className="pt-6 border-t border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Lịch đã thiết lập ({(editingDoctor.availableSlots || []).filter(s => !isPast(s.date)).length || 0})</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                              {(editingDoctor.availableSlots || []).filter(s => !isPast(s.date)).sort((a,b) => a.date.localeCompare(b.date)).map((s, i) => (
                                  <div key={i} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-xl border border-slate-100 text-xs animate-slide-up">
                                      <span className="font-bold text-slate-700">{s.date.split('-').reverse().slice(0,2).join('/')} <span className="text-teal-600 ml-2">{s.time}</span></span>
                                      <button type="button" onClick={() => toggleSlot(s.date, s.time)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: BOOKING */}
      {showBookingModal && pendingDoctor && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-8 animate-slide-up shadow-2xl">
              {bookingSuccess ? (
                <div className="py-12 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40}/></div>
                    <h3 className="text-3xl font-black">Thành công!</h3>
                    <p className="text-slate-500 mt-2">Lịch khám của bạn đã được ghi nhận.</p>
                </div>
              ) : (
                <div className="space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black">Đặt lịch khám</h3>
                            <p className="text-teal-600 font-bold text-sm uppercase">{pendingDoctor.specialty}</p>
                        </div>
                        <button onClick={() => setShowBookingModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition-all"><X size={20}/></button>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                        <img src={pendingDoctor.image} className="w-12 h-12 rounded-xl object-cover border" />
                        <div><p className="font-bold text-slate-800">{pendingDoctor.name}</p><p className="text-xs text-slate-400">Kinh nghiệm: {pendingDoctor.experience} năm</p></div>
                    </div>

                    {/* AI SUMMARY PREVIEW */}
                    {bookingSummary && (
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                             <div className="flex items-center gap-2 mb-1">
                                <Bot size={14} className="text-purple-600"/>
                                <span className="text-[10px] font-black text-purple-600 uppercase">Thông tin cho Bác sĩ (từ AI Chat)</span>
                             </div>
                             <p className="text-xs text-slate-700 italic">"{bookingSummary}"</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="font-bold text-xs text-slate-400 uppercase">1. Chọn ngày rảnh</label>
                            {availableDatesForDoctor.length > 0 ? (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {availableDatesForDoctor.map(date => (
                                        <button 
                                            key={date} 
                                            onClick={() => setBookingDate(date)}
                                            className={`shrink-0 px-5 py-3 rounded-2xl font-bold text-sm border transition-all
                                                ${bookingDate === date ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-200 text-slate-600 hover:border-teal-500'}`}
                                        >
                                            {date === todayStr ? 'Hôm nay' : date.split('-').reverse().slice(0,2).join('/')}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">Bác sĩ chưa có lịch rảnh nào sắp tới.</p>
                            )}
                        </div>

                        {bookingDate && (
                            <div className="space-y-2 animate-fade-in">
                                <label className="font-bold text-xs text-slate-400 uppercase">2. Chọn giờ trống</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {availableTimesForDate.map(time => {
                                        const isBooked = occupiedSlots.includes(time);
                                        const isSelected = bookingTime === time;
                                        return (
                                            <button 
                                                key={time} 
                                                disabled={isBooked}
                                                onClick={() => setBookingTime(time)}
                                                className={`py-3 rounded-xl font-bold text-xs border transition-all flex flex-col items-center
                                                    ${isBooked ? 'bg-slate-100 text-slate-300 border-transparent cursor-not-allowed' : 
                                                    isSelected ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 
                                                    'bg-white border-slate-200 text-slate-600 hover:border-teal-500'}`}
                                            >
                                                {time}
                                                <span className="text-[7px] font-black uppercase mt-0.5">{isBooked ? 'Đã đặt' : 'Chọn'}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-slate-500 text-sm">Tổng phí khám:</span>
                            <span className="font-black text-xl text-slate-900">{pendingDoctor.price.toLocaleString()}đ</span>
                        </div>
                        <button 
                            disabled={!bookingDate || !bookingTime || isSubmitting}
                            onClick={async () => {
                                setIsSubmitting(true);
                                const ok = await saveBooking({
                                    doctorId: pendingDoctor.id, doctorName: pendingDoctor.name, doctorImage: pendingDoctor.image,
                                    specialty: pendingDoctor.specialty, date: bookingDate, time: bookingTime,
                                    userPhone: user?.phone, userFullName: user?.fullName,
                                    aiSummary: bookingSummary // Lưu tóm tắt vào booking
                                });
                                if (ok) {
                                    setBookingSuccess(true);
                                    if (user) {
                                      const updated = await fetchUserBookings(user.phone);
                                      setBookings(updated);
                                    }
                                    setTimeout(() => { setShowBookingModal(false); setBookingSuccess(false); setCurrentPage('history'); }, 2000);
                                }
                                setIsSubmitting(false);
                            }}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-2xl hover:bg-teal-600 transition-all disabled:bg-slate-200 disabled:shadow-none"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : "Xác nhận lịch khám"}
                        </button>
                    </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

export default App;
