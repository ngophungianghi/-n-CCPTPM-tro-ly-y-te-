
import React, { useState, useEffect, useMemo } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { DoctorList } from './components/DoctorList';
import { 
  Home as HomeIcon, MessageSquare, Stethoscope, History, User as UserIcon,
  LogOut, ChevronRight, Calendar, Phone, X, CheckCircle,
  ArrowRight, Loader2, Trash2, Clock, Settings, Plus, Edit, Briefcase,
  Search, Filter, Lock, Info, Camera, HelpCircle, Check, Users as UsersIcon
} from 'lucide-react';
import { Doctor, User, Booking, Specialty, AvailableSlot } from './types';
import { 
  fetchDoctors, saveBooking, fetchUserBookings, updateBookingStatus, 
  fetchAllBookings, saveDoctor, deleteDoctor, registerUser, loginUser,
  checkAvailability, fetchAllUsers, uploadDoctorImage
} from './services/databaseService';

type Page = 'home' | 'chat' | 'doctors' | 'history' | 'auth' | 'admin';
type AuthMode = 'login' | 'register';

const TIME_OPTIONS = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];

// Định nghĩa NavBtn trước để tránh lỗi reference
const NavBtn = ({active, icon, label, onClick}: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }} 
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
  >
    {icon} <span className="hidden lg:inline">{label}</span>
  </button>
);

// Định nghĩa BookingCard trước để tránh lỗi reference
const BookingCard = ({ booking, onCancel }: { booking: Booking; onCancel?: (id: string) => void }) => {
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
          booking.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
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
  const [adminSelectedDate, setAdminSelectedDate] = useState<string>('');

  const [pendingDoctor, setPendingDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 6);
  const maxDateStr = maxDate.toISOString().split('T')[0];

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
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && currentPage === 'admin') refreshAdminData();
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
            } else alert("Số điện thoại đã tồn tại!");
        } else {
            const u = await loginUser(phone, password);
            if (u) {
                setUser(u);
                localStorage.setItem('care_ai_user', JSON.stringify(u));
                const userBks = await fetchUserBookings(phone);
                setBookings(userBks);
                setCurrentPage(u.role === 'admin' ? 'admin' : 'home');
            } else alert("Số điện thoại hoặc mật khẩu không chính xác!");
        }
    } catch (err) {
        alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
        setIsSubmitting(false);
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
    if (!editingDoctor?.name || !editingDoctor?.specialty) return alert("Vui lòng điền đủ thông tin!");
    await saveDoctor(editingDoctor as Doctor);
    await refreshAdminData();
    setShowDocModal(false);
    setEditingDoctor(null);
  };

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
  
  // Không lọc quá mạnh ở phần hiển thị khách hàng để họ xem được lịch sử
  const filteredUserBookings = bookings; 
  const filteredAdminBookings = allBookings.filter(b => !isPast(b.date) || b.status !== 'Chờ khám');

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div onClick={() => setCurrentPage('home')} className="flex items-center gap-3 cursor-pointer">
            <div className="bg-slate-900 p-2 rounded-xl text-white"><Stethoscope size={24} /></div>
            <span className="font-black text-2xl tracking-tighter">CareAI</span>
          </div>
          <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-xl">
            <NavBtn active={currentPage === 'home'} onClick={() => setCurrentPage('home')} icon={<HomeIcon size={18}/>} label="Trang chủ"/>
            <NavBtn active={currentPage === 'chat'} onClick={() => setCurrentPage('chat')} icon={<MessageSquare size={18}/>} label="Tư vấn AI"/>
            <NavBtn active={currentPage === 'doctors'} onClick={() => setCurrentPage('doctors')} icon={<Briefcase size={18}/>} label="Bác sĩ"/>
            <NavBtn active={currentPage === 'history'} onClick={() => setCurrentPage('history')} icon={<History size={18}/>} label="Lịch sử"/>
            {user?.role === 'admin' && <NavBtn active={currentPage === 'admin'} onClick={() => setCurrentPage('admin')} icon={<Settings size={18}/>} label="Admin"/>}
          </div>
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              if (user) {
                setUser(null); 
                localStorage.removeItem('care_ai_user'); 
                setCurrentPage('home'); 
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
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden animate-fade-in shadow-2xl">
                <div className="relative z-10 max-w-xl">
                    <h1 className="text-6xl font-black mb-6 leading-tight">Y tế số <br/><span className="text-teal-400">thông minh</span></h1>
                    <p className="text-slate-400 text-lg mb-8">Admin quản lý lịch rảnh linh hoạt. Khách hàng dễ dàng tìm khung giờ trống phù hợp.</p>
                    <button onClick={() => setCurrentPage('chat')} className="bg-teal-500 text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all">Bắt đầu ngay <ArrowRight size={20}/></button>
                </div>
                <div className="absolute right-[-10%] top-[-10%] w-[50%] h-[120%] bg-teal-500/10 blur-[100px] rounded-full"></div>
            </div>
        )}

        {currentPage === 'chat' && <div className="h-[75vh]"><ChatInterface doctors={doctors} onBook={(d) => { setPendingDoctor(d); if(!user) setCurrentPage('auth'); else setShowBookingModal(true); }} /></div>}
        {currentPage === 'doctors' && <div className="h-[75vh]"><DoctorList doctors={doctors} onBook={(d) => { setPendingDoctor(d); if(!user) setCurrentPage('auth'); else setShowBookingModal(true); }} /></div>}

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
                          if (success && user) {
                            const updated = await fetchUserBookings(user.phone);
                            setBookings(updated);
                          }
                        }} 
                      />
                    ))}
                    {filteredUserBookings.length === 0 && <p className="text-slate-400 col-span-full py-10 text-center">Chưa có lịch hẹn nào.</p>}
                </div>
            </div>
        )}

        {currentPage === 'admin' && user?.role === 'admin' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black">Admin Dashboard</h2>
              <button onClick={() => { setEditingDoctor({ name: '', specialty: Specialty.GENERAL, price: 200000, experience: 5, image: '', availableSlots: [] }); setShowDocModal(true); }} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-700 transition-all"><Plus size={20}/> Thêm Bác sĩ</button>
            </div>
            
            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setAdminTab('bookings')} className={`pb-2 px-4 font-bold transition-all ${adminTab === 'bookings' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>Lịch hẹn khách đặt</button>
                <button onClick={() => setAdminTab('doctors')} className={`pb-2 px-4 font-bold transition-all ${adminTab === 'doctors' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>Quản lý Bác sĩ & Lịch rảnh</button>
                <button onClick={() => setAdminTab('users')} className={`pb-2 px-4 font-bold transition-all ${adminTab === 'users' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>Người dùng</button>
            </div>

            {adminTab === 'doctors' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map(d => (
                        <div key={d.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <img src={d.image || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-2xl object-cover border"/>
                                <div>
                                    <h4 className="font-bold text-lg">{d.name}</h4>
                                    <p className="text-xs text-teal-600 font-bold uppercase">{d.specialty}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock size={12}/> {(d.availableSlots || []).filter(s => !isPast(s.date)).length} khung giờ rảnh
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingDoctor(d); setShowDocModal(true); }} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-100"><Edit size={16}/></button>
                                    <button onClick={() => confirm("Xóa bác sĩ này?") && deleteDoctor(d.id).then(refreshAdminData)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
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
                                        <button onClick={() => updateBookingStatus(b.id, 'Đã hoàn thành').then(refreshAdminData)} className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-xs">Xong</button>
                                        <button onClick={() => updateBookingStatus(b.id, 'Đã hủy').then(refreshAdminData)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-xs">Hủy</button>
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
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.phone} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                        <td className="p-4 font-bold text-slate-800">{u.fullName}</td>
                        <td className="p-4 text-slate-500">{u.phone}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'}`}>
                            {u.role}
                          </span>
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
                  <form onSubmit={onSaveDoctor} className="space-y-6">
                      <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                          <div className="relative w-24 h-24 bg-slate-200 rounded-[2rem] overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
                              {isUploading ? <Loader2 className="animate-spin text-teal-600"/> : editingDoctor.image ? <img src={editingDoctor.image} className="w-full h-full object-cover"/> : <Camera className="text-slate-400"/>}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-slate-700">Ảnh chân dung bác sĩ</p>
                            <input type="file" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if(file) {
                                    setIsUploading(true);
                                    const url = await uploadDoctorImage(file);
                                    setEditingDoctor({...editingDoctor, image: url});
                                    setIsUploading(false);
                                }
                            }} className="text-xs file:bg-teal-50 file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-teal-600 file:font-bold cursor-pointer" />
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Họ tên Bác sĩ</label>
                              <input required value={editingDoctor.name} placeholder="VD: BS. Nguyễn Văn An" className="w-full border-slate-200 rounded-2xl p-4 border outline-none focus:ring-2 focus:ring-teal-500 transition-all" onChange={e => setEditingDoctor({...editingDoctor, name: e.target.value})} />
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
                      </div>

                      <button type="submit" disabled={isUploading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-teal-600 transition-all disabled:bg-slate-300">Lưu thay đổi</button>
                  </form>

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
                                    userPhone: user?.phone, userFullName: user?.fullName
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
