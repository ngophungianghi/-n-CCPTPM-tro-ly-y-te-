
import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { DoctorList } from './components/DoctorList';
import { 
  Home as HomeIcon, 
  MessageSquare, 
  Stethoscope, 
  History, 
  User as UserIcon,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Phone,
  X,
  CheckCircle,
  ArrowRight,
  Loader2,
  Database
} from 'lucide-react';
import { Doctor, User, Booking } from './types';
import { fetchDoctors, saveBooking, fetchUserBookings } from './services/databaseService';
import { MOCK_DOCTORS } from './constants';

type Page = 'home' | 'chat' | 'doctors' | 'history' | 'login';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [suggestedFilter, setSuggestedFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [authData, setAuthData] = useState({ username: '', password: '', phone: '', fullName: '' });

  // Booking Modal State
  const [pendingDoctor, setPendingDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const initApp = async () => {
      try {
        // Load danh sách bác sĩ
        const docs = await fetchDoctors();
        setDoctors(docs);
        
        // Load user từ session cũ
        const savedUser = localStorage.getItem('care_ai_user');
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          // Load lịch sử đặt lịch
          const userHistory = await fetchUserBookings(parsedUser.phone);
          setBookings(userHistory);
        }
      } catch (error) {
        console.error("Lỗi khởi tạo ứng dụng:", error);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  // FIX LỖI LỊCH SỬ: Tự động refresh dữ liệu khi chuyển sang tab history
  useEffect(() => {
    if (currentPage === 'history' && user) {
      const refreshHistory = async () => {
        const history = await fetchUserBookings(user.phone);
        setBookings(history);
      };
      refreshHistory();
    }
  }, [currentPage, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { 
      username: authData.username || 'user_demo', 
      phone: authData.phone || '0901234567', 
      fullName: authData.fullName || 'Người dùng mới' 
    };
    setUser(newUser);
    localStorage.setItem('care_ai_user', JSON.stringify(newUser));
    
    // Refresh history khi login
    const history = await fetchUserBookings(newUser.phone);
    setBookings(history);
    
    if (pendingDoctor) {
      setCurrentPage('doctors');
      setShowBookingModal(true);
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setBookings([]);
    localStorage.removeItem('care_ai_user');
    setCurrentPage('home');
  };

  const handleBook = (doctor: Doctor) => {
    if (!user) {
      setPendingDoctor(doctor);
      setCurrentPage('login');
      return;
    }
    setPendingDoctor(doctor);
    setShowBookingModal(true);
  };

  // Hàm mới: Xử lý khi bấm "Đặt lịch" từ Chat -> Chuyển sang trang danh sách với bộ lọc
  const handleViewDoctorInList = (doctor: Doctor) => {
    setSuggestedFilter(doctor.specialty);
    setCurrentPage('doctors');
  };

  const confirmBooking = async () => {
    if (!pendingDoctor || !user) return;
    
    setIsSubmittingBooking(true);
    try {
      const bookingData = {
        doctorId: pendingDoctor.id,
        doctorName: pendingDoctor.name,
        doctorImage: pendingDoctor.image,
        specialty: pendingDoctor.specialty,
        date: pendingDoctor.nextAvailable,
        userPhone: user.phone,
        userFullName: user.fullName,
        status: 'Chờ khám'
      };

      await saveBooking(bookingData);
      
      const updatedHistory = await fetchUserBookings(user.phone);
      setBookings(updatedHistory);
      
      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        setPendingDoctor(null);
        setCurrentPage('history');
      }, 1500);
    } catch (error) {
      alert("Đã có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 size={48} className="text-teal-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const renderHome = () => (
    <div className="animate-fade-in space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-8 sm:p-16 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold mb-8 text-teal-400 border border-teal-500/30">
            <ShieldCheck size={16} /> HỆ THỐNG Y TẾ THÔNG MINH
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-8 leading-[1.05] tracking-tight">
            Chăm sóc <br/><span className="text-teal-400">tận tâm</span> bằng <br/>trí tuệ nhân tạo.
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl mb-10 leading-relaxed max-w-lg">
            Sàng lọc triệu chứng chính xác, gợi ý bác sĩ chuyên khoa phù hợp và đặt lịch chỉ trong 30 giây.
          </p>
          <div className="flex flex-wrap gap-5">
            <button onClick={() => setCurrentPage('chat')} className="bg-teal-500 hover:bg-teal-400 text-slate-900 px-10 py-5 rounded-2xl font-bold transition-all shadow-xl shadow-teal-500/20 flex items-center gap-3 active:scale-95">
              Khám Phá Cùng AI <ArrowRight size={20} />
            </button>
            <button onClick={() => setCurrentPage('doctors')} className="bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 px-10 py-5 rounded-2xl font-bold transition-all active:scale-95">
              Tìm Bác Sĩ
            </button>
          </div>
        </div>
      </section>

      {/* Specialty Quick Links */}
      <section className="container mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900">Chuyên Khoa Nổi Bật</h2>
          <button onClick={() => setCurrentPage('doctors')} className="text-teal-600 font-bold flex items-center gap-2 hover:underline">
            Xem tất cả <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'Da liễu', icon: '🧴', color: 'bg-orange-50', text: 'text-orange-600' },
            { name: 'Nhi khoa', icon: '👶', color: 'bg-blue-50', text: 'text-blue-600' },
            { name: 'Tim mạch', icon: '🫀', color: 'bg-red-50', text: 'text-red-600' },
            { name: 'Tai Mũi Họng', icon: '👂', color: 'bg-teal-50', text: 'text-teal-600' }
          ].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => { setSuggestedFilter(item.name); setCurrentPage('doctors'); }}
              className="group cursor-pointer bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-center"
            >
              <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <h3 className={`font-extrabold ${item.text}`}>{item.name}</h3>
              <p className="text-slate-400 text-xs mt-2">Bác sĩ chuyên khoa đầu ngành</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderHistory = () => (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Lịch Hẹn Của Bạn</h2>
           <div className="flex items-center gap-2 mt-2">
             <Database size={14} className="text-teal-600"/>
             <p className="text-slate-500 font-medium">Dữ liệu được lưu trữ an toàn trên thiết bị của bạn.</p>
           </div>
        </div>
        <div className="bg-white border border-slate-100 shadow-sm px-6 py-3 rounded-2xl flex items-center gap-3">
          <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
          <span className="text-slate-700 font-bold">{bookings.length} cuộc hẹn</span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white py-20 rounded-[3rem] text-center border border-slate-100 shadow-sm">
           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={48} className="text-slate-200" />
           </div>
           <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có lịch hẹn</h3>
           <button onClick={() => setCurrentPage('chat')} className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-teal-700 transition-all">
              Đặt lịch khám ngay
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map(b => (
            <div key={b.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-2 h-full bg-teal-500 transition-all"></div>
              <img src={b.doctorImage} alt={b.doctorName} className="w-24 h-24 rounded-[2rem] object-cover border-4 border-slate-50 shadow-sm" />
              <div className="flex-1">
                <h3 className="font-extrabold text-slate-900 text-xl">{b.doctorName}</h3>
                <p className="text-teal-600 text-sm font-black uppercase tracking-wider mb-4">{b.specialty}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                    <Calendar size={16} /> 
                    <span>Ngày: <span className="text-slate-800">{b.date}</span></span>
                  </div>
                  <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-bold ${
                    b.status === 'Chờ khám' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 px-4 py-4">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <div onClick={() => setCurrentPage('home')} className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-slate-900 p-2.5 rounded-2xl group-hover:bg-teal-600 transition-colors shadow-lg">
              <Stethoscope className="text-white" size={24} />
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">CareAI</span>
          </div>

          <div className="hidden lg:flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1">
            {[
              { id: 'home', icon: <HomeIcon size={18}/>, label: 'Trang chủ' },
              { id: 'chat', icon: <MessageSquare size={18}/>, label: 'Tư vấn AI' },
              { id: 'doctors', icon: <Stethoscope size={18}/>, label: 'Bác sĩ' },
              { id: 'history', icon: <History size={18}/>, label: 'Lịch sử' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all
                  ${currentPage === item.id ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 bg-white p-1 rounded-2xl border border-slate-100 pr-4 shadow-sm">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold uppercase">
                  {user.username.charAt(0)}
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={() => setCurrentPage('login')} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-sm font-black hover:bg-teal-600 transition-all">
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto max-w-7xl p-4 sm:p-10">
        {currentPage === 'home' && renderHome()}
        {currentPage === 'chat' && (
          <div className="h-[calc(100vh-180px)] animate-fade-in">
            <ChatInterface 
              onSpecialtyDetected={setSuggestedFilter} 
              onBook={handleViewDoctorInList} 
            />
          </div>
        )}
        {currentPage === 'doctors' && (
          <div className="h-[calc(100vh-180px)] animate-fade-in">
            <DoctorList 
              initialFilter={suggestedFilter} 
              key={suggestedFilter}
              onBook={handleBook}
              doctors={doctors}
            />
          </div>
        )}
        {currentPage === 'history' && renderHistory()}
        {currentPage === 'login' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-slide-up px-4">
            <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 w-full max-w-md">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <UserIcon size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Đăng Nhập</h2>
                <p className="text-slate-500 text-sm mt-3 font-medium">Vui lòng đăng nhập để thực hiện đặt lịch khám</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    required
                    placeholder="Tên đăng nhập" 
                    className="w-full bg-slate-50 border-0 rounded-2xl py-5 pl-14 pr-6 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
                    onChange={e => setAuthData({...authData, username: e.target.value})}
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="tel" 
                    required
                    placeholder="Số điện thoại liên lạc" 
                    className="w-full bg-slate-50 border-0 rounded-2xl py-5 pl-14 pr-6 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium"
                    onChange={e => setAuthData({...authData, phone: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-teal-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all text-lg">
                  Đăng Nhập Ngay
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Booking Confirm Modal */}
      {showBookingModal && pendingDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl animate-fade-in">
           <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border border-slate-100">
              <div className="p-10">
                 {bookingSuccess ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                       <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce">
                          <CheckCircle size={56} />
                       </div>
                       <h4 className="font-black text-3xl text-slate-900 mb-4 tracking-tight">Xác nhận thành công!</h4>
                       <p className="text-slate-500 font-medium">Lịch hẹn đã được lưu vào danh sách của bạn.</p>
                    </div>
                 ) : (
                    <>
                       <div className="flex justify-between items-center mb-10">
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Xác Nhận Đặt Lịch</h3>
                          <button onClick={() => setShowBookingModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><X size={24}/></button>
                       </div>

                       <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-10 border border-slate-100">
                          <div className="flex gap-6 mb-6">
                             <img src={pendingDoctor.image} alt={pendingDoctor.name} className="w-20 h-20 rounded-[1.5rem] object-cover border-4 border-white shadow-md" />
                             <div>
                                <h4 className="font-black text-slate-900 text-xl">{pendingDoctor.name}</h4>
                                <p className="text-teal-600 text-sm font-black uppercase tracking-widest mt-1">{pendingDoctor.specialty}</p>
                             </div>
                          </div>
                          <div className="space-y-4 pt-6 border-t border-slate-200">
                             <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium flex items-center gap-2"><Calendar size={16}/> Thời gian dự kiến:</span>
                                <span className="font-black text-slate-900">{pendingDoctor.nextAvailable}</span>
                             </div>
                          </div>
                       </div>

                       <button 
                        onClick={confirmBooking} 
                        disabled={isSubmittingBooking}
                        className="w-full bg-slate-900 hover:bg-teal-600 text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all active:scale-95 text-lg disabled:opacity-50"
                       >
                          {isSubmittingBooking ? <Loader2 className="animate-spin mx-auto" /> : "Xác Nhận & Lưu Lịch"}
                       </button>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;
